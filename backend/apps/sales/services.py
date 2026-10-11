from django.db import transaction
from django.utils import timezone

from apps.core.exceptions import InvalidStateTransition, WarehouseForbidden
from apps.core.pricing import compute_line_amounts
from apps.inventory.models import MovementType
from apps.inventory.services import apply_stock_delta
from apps.sales.models import Sale, SaleStatus


def recompute_sale_totals(sale: Sale):
    subtotal = 0
    discount = 0
    tax = 0
    total = 0
    for item in sale.items.all():
        gross = item.quantity * item.unit_price
        if item.discount > gross:
            raise InvalidStateTransition("La remise d'une ligne ne peut pas dépasser son montant.")
        item.tax, item.total = compute_line_amounts(
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount=item.discount,
            organization=sale.organization,
        )
        item.save(update_fields=["tax", "total"])
        subtotal += gross
        discount += item.discount
        tax += item.tax
        total += item.total
    sale.subtotal = subtotal
    sale.discount = discount
    sale.tax = tax
    sale.total = total
    sale.save(update_fields=["subtotal", "discount", "tax", "total", "updated_at"])


def _assert_discount_allowed(membership, items):
    """Plafond de remise par rôle (§33.1).

    Un prix unitaire inférieur au prix catalogue compte comme une remise : sinon
    un vendeur à 0 % pourrait contourner le plafond en baissant simplement le prix.
    """
    reference_total = 0
    effective_discount = 0
    for item in items:
        catalog_price = item.product.selling_price
        reference_total += max(catalog_price, item.unit_price) * item.quantity
        effective_discount += max(0, catalog_price - item.unit_price) * item.quantity
        effective_discount += item.discount
    if reference_total <= 0 or effective_discount <= 0:
        return
    max_pct = membership.max_discount_percent()
    if effective_discount * 100 > max_pct * reference_total:
        raise InvalidStateTransition(
            f"Remise trop élevée pour votre rôle (maximum {max_pct} %).",
        )


def _lock_sale(sale: Sale) -> Sale:
    return Sale.objects.select_for_update().get(pk=sale.pk)


@transaction.atomic
def complete_sale(sale: Sale, user, membership):
    # Verrou sur la vente : deux validations simultanées ne déstockent pas deux fois.
    sale = _lock_sale(sale)
    if sale.status != SaleStatus.DRAFT:
        raise InvalidStateTransition("Seule une vente brouillon peut être validée.")
    # Ordre stable des verrous de stock pour éviter les interblocages.
    items = list(sale.items.select_related("product").order_by("product_id"))
    if not items:
        raise InvalidStateTransition("La vente n'a aucune ligne.")
    if not membership.can_access_warehouse(sale.warehouse):
        raise WarehouseForbidden()
    for item in items:
        if not item.product.is_active:
            raise InvalidStateTransition(
                f"Le produit {item.product.name} est désactivé et ne peut plus être vendu."
            )
    _assert_discount_allowed(membership, items)
    recompute_sale_totals(sale)

    for item in items:
        apply_stock_delta(
            organization=sale.organization,
            product=item.product,
            warehouse=sale.warehouse,
            delta=-item.quantity,
            movement_type=MovementType.SALE,
            user=user,
            reference_type="sale",
            reference_id=sale.id,
            unit_cost=item.product.purchase_price,
        )

    sale.status = SaleStatus.COMPLETED
    sale.completed_at = timezone.now()
    sale.save(update_fields=["status", "completed_at", "updated_at"])
    return sale


@transaction.atomic
def cancel_sale(sale: Sale, user, membership):
    sale = _lock_sale(sale)
    if sale.status != SaleStatus.COMPLETED:
        raise InvalidStateTransition("Seule une vente terminée peut être annulée.")
    if not membership.has_perm("sales.cancel"):
        raise InvalidStateTransition("Vous ne pouvez pas annuler une vente validée.")
    for item in sale.items.select_related("product").order_by("product_id"):
        apply_stock_delta(
            organization=sale.organization,
            product=item.product,
            warehouse=sale.warehouse,
            delta=item.quantity,
            movement_type=MovementType.SALE_CANCEL,
            user=user,
            reference_type="sale",
            reference_id=sale.id,
            reason="Annulation de vente",
        )
    sale.status = SaleStatus.CANCELLED
    sale.save(update_fields=["status", "updated_at"])
    return sale
