"""Inventaires (§34-35) : aucun effet stock avant la validation.

L'écart d'une ligne vaut « compté − théorique », le théorique étant figé au
démarrage du comptage. À la validation, cet écart est appliqué au stock
courant par un mouvement INVENTORY_ADJUSTMENT, dans une seule transaction.
"""

from django.db import transaction
from django.utils import timezone

from apps.core.exceptions import InvalidStateTransition, WarehouseForbidden
from apps.inventory.models import (
    InventoryCount,
    InventoryLine,
    InventoryStatus,
    MovementType,
    StockPosition,
)
from apps.inventory.services import apply_stock_delta
from apps.products.models import Product


def _lock(inventory: InventoryCount) -> InventoryCount:
    return InventoryCount.objects.select_for_update().get(pk=inventory.pk)


def _check_access(inventory, membership):
    if not membership.can_access_warehouse(inventory.warehouse):
        raise WarehouseForbidden()


def _require(inventory, *statuses, message):
    if inventory.status not in statuses:
        raise InvalidStateTransition(message)


@transaction.atomic
def start_counting(inventory, membership):
    inventory = _lock(inventory)
    _require(inventory, InventoryStatus.DRAFT, message="Seul un inventaire brouillon peut être démarré.")
    _check_access(inventory, membership)
    products = Product.objects.filter(organization=inventory.organization, is_active=True)
    if inventory.category_id:
        products = products.filter(category_id=inventory.category_id)
    product_ids = list(products.values_list("id", flat=True))
    if not product_ids:
        raise InvalidStateTransition("Aucun produit actif à inventorier.")
    stock = dict(
        StockPosition.objects.filter(
            organization=inventory.organization, warehouse=inventory.warehouse
        ).values_list("product_id", "quantity")
    )
    InventoryLine.objects.bulk_create(
        InventoryLine(inventory=inventory, product_id=pid, expected_quantity=stock.get(pid, 0))
        for pid in product_ids
    )
    inventory.status = InventoryStatus.COUNTING
    inventory.started_at = timezone.now()
    inventory.save(update_fields=["status", "started_at", "updated_at"])
    return inventory


def _resolve_line(lines_by_product, lines_by_code, entry):
    if entry.get("product"):
        line = lines_by_product.get(entry["product"])
    else:
        line = lines_by_code.get(entry["code"].strip().upper())
    if line is None:
        label = entry.get("code") or "Ce produit"
        raise InvalidStateTransition(f"{label} ne fait pas partie de cet inventaire.")
    return line


@transaction.atomic
def record_counts(inventory, entries, user, membership):
    """Enregistre des comptages : quantité absolue, incrément (scan) ou remise à zéro (None)."""
    inventory = _lock(inventory)
    _require(inventory, InventoryStatus.COUNTING, message="Le comptage n'est pas ouvert sur cet inventaire.")
    _check_access(inventory, membership)
    lines = list(inventory.lines.select_related("product"))
    by_product = {line.product_id: line for line in lines}
    by_code = {}
    for line in lines:
        by_code[line.product.sku.upper()] = line
        if line.product.barcode:
            by_code[line.product.barcode.upper()] = line

    now = timezone.now()
    touched = {}
    for entry in entries:
        line = _resolve_line(by_product, by_code, entry)
        if "add" in entry:
            line.counted_quantity = (line.counted_quantity or 0) + entry["add"]
        else:
            line.counted_quantity = entry["counted_quantity"]
        line.counted_by = user if line.counted_quantity is not None else None
        line.counted_at = now if line.counted_quantity is not None else None
        touched[line.pk] = line
    InventoryLine.objects.bulk_update(
        touched.values(), ["counted_quantity", "counted_by", "counted_at"]
    )
    return list(touched.values())


@transaction.atomic
def submit_for_review(inventory, membership):
    inventory = _lock(inventory)
    _require(inventory, InventoryStatus.COUNTING, message="Seul un inventaire en comptage peut passer en revue.")
    _check_access(inventory, membership)
    if not inventory.lines.filter(counted_quantity__isnull=False).exists():
        raise InvalidStateTransition("Aucune quantité n'a encore été comptée.")
    inventory.status = InventoryStatus.REVIEW
    inventory.save(update_fields=["status", "updated_at"])
    return inventory


@transaction.atomic
def reopen_counting(inventory, membership):
    inventory = _lock(inventory)
    _require(inventory, InventoryStatus.REVIEW, message="Seul un inventaire en revue peut être rouvert.")
    _check_access(inventory, membership)
    inventory.status = InventoryStatus.COUNTING
    inventory.save(update_fields=["status", "updated_at"])
    return inventory


@transaction.atomic
def validate_inventory(inventory, user, membership):
    inventory = _lock(inventory)
    _require(inventory, InventoryStatus.REVIEW, message="L'inventaire doit être en revue pour être validé.")
    _check_access(inventory, membership)
    # Ordre stable des verrous de stock (cf. ventes et transferts).
    lines = (
        inventory.lines.filter(counted_quantity__isnull=False)
        .select_related("product")
        .order_by("product_id")
    )
    for line in lines:
        delta = line.difference
        if not delta:
            continue
        current = (
            StockPosition.objects.filter(
                organization=inventory.organization,
                warehouse=inventory.warehouse,
                product=line.product,
            )
            .values_list("quantity", flat=True)
            .first()
            or 0
        )
        if current + delta < 0:
            raise InvalidStateTransition(
                f"Impossible d'appliquer l'écart de {line.product.name} ({delta:+d}) : "
                f"le stock actuel ({current}) a baissé depuis le début du comptage. "
                "Rouvrez le comptage pour recompter ce produit."
            )
        apply_stock_delta(
            organization=inventory.organization,
            product=line.product,
            warehouse=inventory.warehouse,
            delta=delta,
            movement_type=MovementType.INVENTORY_ADJUSTMENT,
            user=user,
            reference_type="inventory",
            reference_id=inventory.id,
            reason=f"Inventaire {inventory.reference}",
            unit_cost=line.product.purchase_price,
        )
    inventory.status = InventoryStatus.VALIDATED
    inventory.validated_by = user
    inventory.validated_at = timezone.now()
    inventory.save(update_fields=["status", "validated_by", "validated_at", "updated_at"])
    return inventory


@transaction.atomic
def cancel_inventory(inventory, membership):
    inventory = _lock(inventory)
    _require(
        inventory,
        InventoryStatus.DRAFT,
        InventoryStatus.COUNTING,
        InventoryStatus.REVIEW,
        message="Un inventaire validé ou déjà annulé ne peut plus être annulé.",
    )
    _check_access(inventory, membership)
    inventory.status = InventoryStatus.CANCELLED
    inventory.save(update_fields=["status", "updated_at"])
    return inventory
