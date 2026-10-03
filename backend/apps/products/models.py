from django.db import models

from apps.core.models import OrganizationOwnedModel


class Category(OrganizationOwnedModel):
    name = models.CharField(max_length=120)
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="children"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "name"], name="uniq_category_name_per_org"
            )
        ]

    def __str__(self):
        return self.name


class Product(OrganizationOwnedModel):
    category = models.ForeignKey(
        Category, null=True, blank=True, on_delete=models.SET_NULL, related_name="products"
    )
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.CASCADE, related_name="variants"
    )
    is_variant = models.BooleanField(default=False)
    sku = models.CharField(max_length=64)
    barcode = models.CharField(max_length=64, blank=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    unit = models.CharField(max_length=32, default="pièce")
    purchase_price = models.BigIntegerField(default=0)
    selling_price = models.BigIntegerField(default=0)
    minimum_stock = models.PositiveIntegerField(default=0)
    maximum_stock = models.PositiveIntegerField(null=True, blank=True)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "sku"],
                condition=models.Q(is_active=True),
                name="uniq_active_sku_per_org",
            ),
            models.UniqueConstraint(
                fields=["organization", "barcode"],
                condition=models.Q(is_active=True) & ~models.Q(barcode=""),
                name="uniq_active_barcode_per_org",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.sku})"
