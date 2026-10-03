from django.db import transaction
from django.utils import timezone

from apps.core.exceptions import InvalidStateTransition, WarehouseForbidden
from apps.inventory.models import MovementType
from apps.inventory.services import apply_stock_delta
from apps.sales.models import Sale, SaleStatus


def recompute_sale_totals(sale: Sale):
    subtotal = 0
    discount = 0
    tax = 0
    total = 0
    for item in sale.items.all():
        line = item.quantity * item.unit_price - item.discount
        item.total = line + item.tax
        item.save(update_fields=["total"])
        subtotal += item.quantity * item.unit_price
        discount += item.discount
        tax += item.tax
        total += item.total
    if total < 0:
        raise InvalidStateTransition("Le total de la vente ne peut pas être négatif.")
    sale.subtotal = subtotal
    sale.discount = discount
    sale.tax = tax
    sale.total = total
    sale.save(update_fields=["subtotal", "discount", "tax", "total", "updated_at"])


def _assert_discount_allowed(membership, sale: Sale):
    max_pct = membership.max_discount_percent()
    if sale.subtotal <= 0:
        return
    pct = (sale.discount * 100) / sale.subtotal
    if pct > max_pct + 1e-6:
        raise InvalidStateTransition(
            f"Remise trop élevée pour votre rôle (maximum {max_pct} %)."
        )


@transaction.atomic
def complete_sale(sale: Sale, user, membership):
    if sale.status != SaleStatus.DRAFT:
        raise InvalidStateTransition("Seule une vente brouillon peut être validée.")
    items = list(sale.items.select_related("product"))
    if not items:
        raise InvalidStateTransition("La vente n'a aucune ligne.")
    if not membership.can_access_warehouse(sale.warehouse):
        raise WarehouseForbidden()
    for item in items:
        if not item.product.is_active:
            raise InvalidStateTransition(
                f"Le produit {item.product.name} est désactivé et ne peut plus être vendu."
            )
    recompute_sale_totals(sale)
    _assert_discount_allowed(membership, sale)

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
    if sale.status != SaleStatus.COMPLETED:
        raise InvalidStateTransition("Seule une vente terminée peut être annulée.")
    if not membership.has_perm("sales.cancel"):
        raise InvalidStateTransition("Vous ne pouvez pas annuler une vente validée.")
    for item in sale.items.select_related("product"):
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
