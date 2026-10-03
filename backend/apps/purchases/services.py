from django.db import transaction
from django.utils import timezone

from apps.core.exceptions import InvalidStateTransition, WarehouseForbidden
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
        line = item.quantity * item.unit_price - item.discount
        item.total = line + item.tax
        item.save(update_fields=["total"])
        subtotal += item.quantity * item.unit_price
        discount += item.discount
        tax += item.tax
        total += item.total
    purchase.subtotal = subtotal
    purchase.discount = discount
    purchase.tax = tax
    purchase.total = total
    purchase.save(update_fields=["subtotal", "discount", "tax", "total", "updated_at"])


@transaction.atomic
def confirm_purchase(purchase: Purchase):
    if purchase.status != PurchaseStatus.DRAFT:
        raise InvalidStateTransition("Seul un achat brouillon peut être confirmé.")
    if not purchase.items.exists():
        raise InvalidStateTransition("L'achat n'a aucune ligne.")
    purchase.status = PurchaseStatus.CONFIRMED
    purchase.save(update_fields=["status", "updated_at"])
    return purchase


@transaction.atomic
def cancel_purchase(purchase: Purchase):
    if purchase.status not in {PurchaseStatus.DRAFT, PurchaseStatus.CONFIRMED}:
        raise InvalidStateTransition("Cet achat ne peut plus être annulé.")
    if purchase.items.filter(quantity_received__gt=0).exists():
        raise InvalidStateTransition("Impossible d'annuler un achat déjà partiellement reçu.")
    purchase.status = PurchaseStatus.CANCELLED
    purchase.save(update_fields=["status", "updated_at"])
    return purchase


@transaction.atomic
def receive_purchase(purchase: Purchase, lines: list[dict], user, membership):
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

    for line in lines:
        item = items_by_id.get(str(line["purchase_item_id"]))
        if item is None:
            raise InvalidStateTransition("Ligne d'achat introuvable.")
        qty = int(line["quantity"])
        if qty <= 0:
            raise InvalidStateTransition("La quantité reçue doit être positive.")
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
