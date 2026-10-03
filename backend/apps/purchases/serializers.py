from django.utils import timezone
from rest_framework import serializers

from apps.organizations.references import next_reference
from apps.purchases.models import Purchase, PurchaseItem
from apps.purchases.services import recompute_purchase_totals


class PurchaseItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = PurchaseItem
        fields = [
            "id",
            "product",
            "product_name",
            "quantity",
            "quantity_received",
            "unit_price",
            "discount",
            "tax",
            "total",
        ]
        read_only_fields = ["id", "quantity_received", "total"]


class PurchaseSerializer(serializers.ModelSerializer):
    items = PurchaseItemSerializer(many=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)

    class Meta:
        model = Purchase
        fields = [
            "id",
            "supplier",
            "supplier_name",
            "warehouse",
            "warehouse_name",
            "reference",
            "status",
            "purchase_date",
            "expected_date",
            "subtotal",
            "discount",
            "tax",
            "total",
            "items",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "reference",
            "status",
            "subtotal",
            "discount",
            "tax",
            "total",
            "created_at",
        ]
        extra_kwargs = {"purchase_date": {"required": False}}

    def create(self, validated):
        items = validated.pop("items")
        validated.pop("organization", None)
        request = self.context["request"]
        purchase_date = validated.pop("purchase_date", None) or timezone.localdate()
        purchase = Purchase.objects.create(
            organization=request.organization,
            reference=next_reference(request.organization, "PURCHASE"),
            created_by=request.user,
            purchase_date=purchase_date,
            **validated,
        )
        for item in items:
            PurchaseItem.objects.create(purchase=purchase, **item)
        recompute_purchase_totals(purchase)
        return purchase


class ReceiveSerializer(serializers.Serializer):
    lines = serializers.ListField(child=serializers.DictField(), allow_empty=False)
