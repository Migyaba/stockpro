from django.db import transaction
from django.utils import timezone

from apps.core.exceptions import InvalidStateTransition, WarehouseForbidden
from apps.core.pricing import compute_line_amounts
from apps.inventory.models import MovementType
from apps.inventory.services import apply_stock_delta
from apps.organizations.references import next_reference
from apps.purchases.models import (
    Purchase,
    PurchaseReceipt,
    PurchaseReceiptItem,
    PurchaseStatus,
)


def recompute_purchase_totals(purchase: Purchase):
    subtotal = 0
    discount = 0
    tax = 0
    total = 0
    for item in purchase.items.all():
        gross = item.quantity * item.unit_price
        if item.discount > gross:
            raise InvalidStateTransition("La remise d'une ligne ne peut pas dépasser son montant.")
        item.tax, item.total = compute_line_amounts(
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount=item.discount,
            organization=purchase.organization,
        )
        item.save(update_fields=["tax", "total"])
        subtotal += gross
        discount += item.discount
        tax += item.tax
        total += item.total
    purchase.subtotal = subtotal
    purchase.discount = discount
    purchase.tax = tax
    purchase.total = total
    purchase.save(update_fields=["subtotal", "discount", "tax", "total", "updated_at"])


def _lock_purchase(purchase: Purchase) -> Purchase:
    return Purchase.objects.select_for_update().get(pk=purchase.pk)


@transaction.atomic
def confirm_purchase(purchase: Purchase):
    purchase = _lock_purchase(purchase)
    if purchase.status != PurchaseStatus.DRAFT:
        raise InvalidStateTransition("Seul un achat brouillon peut être confirmé.")
    if not purchase.items.exists():
        raise InvalidStateTransition("L'achat n'a aucune ligne.")
    purchase.status = PurchaseStatus.CONFIRMED
    purchase.save(update_fields=["status", "updated_at"])
    return purchase


@transaction.atomic
def cancel_purchase(purchase: Purchase):
    purchase = _lock_purchase(purchase)
    if purchase.status not in {PurchaseStatus.DRAFT, PurchaseStatus.CONFIRMED}:
        raise InvalidStateTransition("Cet achat ne peut plus être annulé.")
    if purchase.items.filter(quantity_received__gt=0).exists():
        raise InvalidStateTransition("Impossible d'annuler un achat déjà partiellement reçu.")
    purchase.status = PurchaseStatus.CANCELLED
    purchase.save(update_fields=["status", "updated_at"])
    return purchase


@transaction.atomic
def receive_purchase(purchase: Purchase, lines: list[dict], user, membership):
    # Verrou sur l'achat : deux réceptions simultanées ne peuvent pas dépasser la quantité commandée.
    purchase = _lock_purchase(purchase)
    if purchase.status not in {
        PurchaseStatus.CONFIRMED,
        PurchaseStatus.PARTIALLY_RECEIVED,
    }:
        raise InvalidStateTransition("Seuls les achats confirmés peuvent être réceptionnés.")
    if not membership.can_access_warehouse(purchase.warehouse):
        raise WarehouseForbidden()

    receipt = PurchaseReceipt.objects.create(
        organization=purchase.organization,
        purchase=purchase,
        warehouse=purchase.warehouse,
        received_by=user,
        received_at=timezone.now(),
        reference=next_reference(purchase.organization, "RECEIPT"),
    )

    items_by_id = {str(item.id): item for item in purchase.items.select_related("product")}
    if not lines:
        raise InvalidStateTransition("Aucune quantité à réceptionner.")

    resolved = []
    for line in lines:
        item = items_by_id.get(str(line["purchase_item_id"]))
        if item is None:
            raise InvalidStateTransition("Ligne d'achat introuvable.")
        resolved.append((item, line["quantity"]))
    # Verrous de stock pris par produit croissant, comme ventes et transferts :
    # deux réceptions concurrentes ne peuvent pas s'interbloquer.
    resolved.sort(key=lambda pair: str(pair[0].product_id))

    for item, qty in resolved:
        remaining = item.quantity - item.quantity_received
        if qty > remaining:
            raise InvalidStateTransition(
                f"Quantité trop élevée pour {item.product.name} (reste {remaining})."
            )
        PurchaseReceiptItem.objects.create(
            receipt=receipt, purchase_item=item, quantity=qty
        )
        item.quantity_received += qty
        item.save(update_fields=["quantity_received"])
        apply_stock_delta(
            organization=purchase.organization,
            product=item.product,
            warehouse=purchase.warehouse,
            delta=qty,
            movement_type=MovementType.PURCHASE,
            user=user,
            reference_type="purchase_receipt",
            reference_id=receipt.id,
            unit_cost=item.unit_price,
        )

    purchase.refresh_from_db()
    items = list(purchase.items.all())
    if all(i.quantity_received >= i.quantity for i in items):
        purchase.status = PurchaseStatus.RECEIVED
    else:
        purchase.status = PurchaseStatus.PARTIALLY_RECEIVED
    purchase.save(update_fields=["status", "updated_at"])
    return receipt
