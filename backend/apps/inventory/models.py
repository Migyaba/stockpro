from django.conf import settings
from django.db import models

from apps.core.models import OrganizationOwnedModel, UUIDModel


class Warehouse(OrganizationOwnedModel):
    name = models.CharField(max_length=160)
    code = models.CharField(max_length=32)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=120, blank=True)
    manager_name = models.CharField(max_length=160, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "code"], name="uniq_warehouse_code_per_org"
            )
        ]

    def __str__(self):
        return self.name


class StockPosition(OrganizationOwnedModel):
    product = models.ForeignKey(
        "products.Product", on_delete=models.PROTECT, related_name="positions"
    )
    warehouse = models.ForeignKey(
        Warehouse, on_delete=models.PROTECT, related_name="positions"
    )
    quantity = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "product", "warehouse"],
                name="uniq_stock_position",
            )
        ]


class MovementType(models.TextChoices):
    INITIAL = "INITIAL"
    PURCHASE = "PURCHASE"
    SALE = "SALE"
    SALE_CANCEL = "SALE_CANCEL"
    TRANSFER_IN = "TRANSFER_IN"
    TRANSFER_OUT = "TRANSFER_OUT"
    INVENTORY_ADJUSTMENT = "INVENTORY_ADJUSTMENT"
    RETURN = "RETURN"
    DAMAGE = "DAMAGE"
    OTHER = "OTHER"


class StockMovement(OrganizationOwnedModel):
    product = models.ForeignKey(
        "products.Product", on_delete=models.PROTECT, related_name="movements"
    )
    warehouse = models.ForeignKey(
        Warehouse, on_delete=models.PROTECT, related_name="movements"
    )
    type = models.CharField(max_length=32, choices=MovementType.choices)
    quantity = models.IntegerField(help_text="Signée : + entrée, − sortie")
    unit_cost = models.BigIntegerField(default=0)
    reference_type = models.CharField(max_length=64, blank=True)
    reference_id = models.CharField(max_length=64, blank=True)
    reason = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        ordering = ["-created_at"]


class TransferStatus(models.TextChoices):
    DRAFT = "DRAFT"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Transfer(OrganizationOwnedModel):
    reference = models.CharField(max_length=32)
    source = models.ForeignKey(
        Warehouse, on_delete=models.PROTECT, related_name="outgoing_transfers"
    )
    destination = models.ForeignKey(
        Warehouse, on_delete=models.PROTECT, related_name="incoming_transfers"
    )
    status = models.CharField(
        max_length=20, choices=TransferStatus.choices, default=TransferStatus.DRAFT
    )
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="transfers"
    )
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "reference"], name="uniq_transfer_ref"
            )
        ]


class TransferItem(UUIDModel):
    transfer = models.ForeignKey(Transfer, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("products.Product", on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
