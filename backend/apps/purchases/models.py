from django.conf import settings
from django.db import models

from apps.core.models import OrganizationOwnedModel, UUIDModel


class PurchaseStatus(models.TextChoices):
    DRAFT = "DRAFT"
    CONFIRMED = "CONFIRMED"
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED"
    RECEIVED = "RECEIVED"
    CANCELLED = "CANCELLED"


class Purchase(OrganizationOwnedModel):
    supplier = models.ForeignKey(
        "suppliers.Supplier", on_delete=models.PROTECT, related_name="purchases"
    )
    warehouse = models.ForeignKey(
        "inventory.Warehouse", on_delete=models.PROTECT, related_name="purchases"
    )
    reference = models.CharField(max_length=32)
    status = models.CharField(
        max_length=24, choices=PurchaseStatus.choices, default=PurchaseStatus.DRAFT
    )
    purchase_date = models.DateField()
    expected_date = models.DateField(null=True, blank=True)
    subtotal = models.BigIntegerField(default=0)
    discount = models.BigIntegerField(default=0)
    tax = models.BigIntegerField(default=0)
    total = models.BigIntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="purchases"
    )

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "reference"], name="uniq_purchase_ref"
            )
        ]


class PurchaseItem(UUIDModel):
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("products.Product", on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    quantity_received = models.PositiveIntegerField(default=0)
    unit_price = models.BigIntegerField()
    discount = models.BigIntegerField(default=0)
    tax = models.BigIntegerField(default=0)
    total = models.BigIntegerField(default=0)


class PurchaseReceipt(OrganizationOwnedModel):
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name="receipts")
    warehouse = models.ForeignKey("inventory.Warehouse", on_delete=models.PROTECT)
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    received_at = models.DateTimeField()
    reference = models.CharField(max_length=32)


class PurchaseReceiptItem(UUIDModel):
    receipt = models.ForeignKey(
        PurchaseReceipt, on_delete=models.CASCADE, related_name="items"
    )
    purchase_item = models.ForeignKey(PurchaseItem, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
