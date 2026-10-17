from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.core.exceptions import WarehouseForbidden
from apps.core.serializers import TenantScopedSerializerMixin, ensure_active_warehouse
from apps.organizations.references import next_reference
from apps.purchases.models import Purchase, PurchaseItem
from apps.purchases.services import recompute_purchase_totals


class PurchaseItemSerializer(TenantScopedSerializerMixin, serializers.ModelSerializer):
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
        read_only_fields = ["id", "quantity_received", "tax", "total"]
        extra_kwargs = {
            "quantity": {"min_value": 1},
            "unit_price": {"min_value": 0},
            "discount": {"min_value": 0},
        }

    def validate_product(self, product):
        # §19.2 : un produit désactivé ne peut plus entrer dans une nouvelle opération.
        if not product.is_active:
            raise serializers.ValidationError(f"Le produit {product.name} est désactivé.")
        return product


class PurchaseSerializer(TenantScopedSerializerMixin, serializers.ModelSerializer):
    items = PurchaseItemSerializer(many=True, allow_empty=False)
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

    def validate_warehouse(self, warehouse):
        if not self.context["request"].membership.can_access_warehouse(warehouse):
            raise WarehouseForbidden()
        return ensure_active_warehouse(warehouse)

    @transaction.atomic
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


class ReceiveLineSerializer(serializers.Serializer):
    purchase_item_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)


class ReceiveSerializer(serializers.Serializer):
    lines = ReceiveLineSerializer(many=True, allow_empty=False)
