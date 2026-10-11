from django.db import IntegrityError, transaction

from apps.core.exceptions import InsufficientStock, InvalidStateTransition
from apps.inventory.models import MovementType, StockMovement, StockPosition, Warehouse
from apps.products.models import Product


def _lock_position(organization, product, warehouse):
    """SELECT … FOR UPDATE ; crée la position à 0 si absente puis la verrouille (§67.1)."""
    lookup = {"organization": organization, "product": product, "warehouse": warehouse}
    try:
        return StockPosition.objects.select_for_update().get(**lookup)
    except StockPosition.DoesNotExist:
        pass
    try:
        with transaction.atomic():
            StockPosition.objects.create(quantity=0, **lookup)
    except IntegrityError:
        # Créée en parallèle par une autre transaction : on verrouille l'existante.
        pass
    return StockPosition.objects.select_for_update().get(**lookup)


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

    position = _lock_position(organization, product, warehouse)
    new_qty = position.quantity + delta
    if new_qty < 0:
        raise InsufficientStock(
            product_name=product.name,
            requested=abs(delta),
            available=position.quantity,
            warehouse_name=warehouse.name,
        )
    old_qty = position.quantity
    position.quantity = new_qty
    position.save(update_fields=["quantity", "updated_at"])
    if delta < 0:
        from apps.notifications.services import notify_stock_threshold

        position.product = product
        position.warehouse = warehouse
        notify_stock_threshold(position, old_qty)
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
