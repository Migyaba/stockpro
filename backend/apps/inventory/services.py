from django.db import transaction

from apps.core.exceptions import InsufficientStock, InvalidStateTransition
from apps.inventory.models import MovementType, StockMovement, StockPosition, Warehouse
from apps.products.models import Product


@transaction.atomic
def apply_stock_delta(
    *,
    organization,
    product: Product,
    warehouse: Warehouse,
    delta: int,
    movement_type: str,
    user=None,
    reference_type="",
    reference_id="",
    reason="",
    unit_cost=0,
):
    if warehouse.organization_id != organization.id:
        raise InvalidStateTransition("Le dépôt n'appartient pas à cette organisation.")
    if product.organization_id != organization.id:
        raise InvalidStateTransition("Le produit n'appartient pas à cette organisation.")

    position, _ = StockPosition.objects.select_for_update().get_or_create(
        organization=organization,
        product=product,
        warehouse=warehouse,
        defaults={"quantity": 0},
    )
    new_qty = position.quantity + delta
    if new_qty < 0:
        raise InsufficientStock(
            product_name=product.name,
            requested=abs(delta),
            available=position.quantity,
            warehouse_name=warehouse.name,
        )
    position.quantity = new_qty
    position.save(update_fields=["quantity", "updated_at"])
    return StockMovement.objects.create(
        organization=organization,
        product=product,
        warehouse=warehouse,
        type=movement_type,
        quantity=delta,
        unit_cost=unit_cost,
        reference_type=reference_type,
        reference_id=str(reference_id) if reference_id else "",
        reason=reason,
        created_by=user,
    )


def initialize_stock(*, organization, product, warehouse, quantity, user=None):
    if quantity < 0:
        raise InvalidStateTransition("Le stock initial ne peut pas être négatif.")
    exists = StockMovement.objects.filter(
        organization=organization,
        product=product,
        warehouse=warehouse,
        type=MovementType.INITIAL,
    ).exists()
    if exists:
        raise InvalidStateTransition(
            "Le stock initial a déjà été saisi pour ce produit dans ce dépôt."
        )
    if quantity == 0:
        StockPosition.objects.get_or_create(
            organization=organization,
            product=product,
            warehouse=warehouse,
            defaults={"quantity": 0},
        )
        return None
    return apply_stock_delta(
        organization=organization,
        product=product,
        warehouse=warehouse,
        delta=quantity,
        movement_type=MovementType.INITIAL,
        user=user,
        reference_type="product",
        reference_id=product.id,
        reason="Stock initial",
        unit_cost=product.purchase_price,
    )
