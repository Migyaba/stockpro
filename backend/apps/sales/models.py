from django.conf import settings
from django.db import models

from apps.core.models import OrganizationOwnedModel, UUIDModel


class SaleStatus(models.TextChoices):
    DRAFT = "DRAFT"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Sale(OrganizationOwnedModel):
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales",
    )
    warehouse = models.ForeignKey(
        "inventory.Warehouse", on_delete=models.PROTECT, related_name="sales"
    )
    reference = models.CharField(max_length=32)
    status = models.CharField(
        max_length=20, choices=SaleStatus.choices, default=SaleStatus.DRAFT
    )
    sale_date = models.DateField()
    subtotal = models.BigIntegerField(default=0)
    discount = models.BigIntegerField(default=0)
    tax = models.BigIntegerField(default=0)
    total = models.BigIntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="sales"
    )
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["organization", "reference"], name="uniq_sale_ref")
        ]


class SaleItem(UUIDModel):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("products.Product", on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.BigIntegerField()
    discount = models.BigIntegerField(default=0)
    tax = models.BigIntegerField(default=0)
    total = models.BigIntegerField(default=0)
