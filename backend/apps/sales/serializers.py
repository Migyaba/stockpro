from django.db import transaction
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.core.exceptions import WarehouseForbidden
from apps.core.serializers import TenantScopedSerializerMixin, ensure_active_warehouse
from apps.organizations.references import next_reference
from apps.reports.periods import organization_today, validate_document_date
from apps.sales.models import Sale, SaleItem
from apps.sales.services import recompute_sale_totals


class SaleItemSerializer(TenantScopedSerializerMixin, serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = SaleItem
        fields = [
            "id",
            "product",
            "product_name",
            "quantity",
            "unit_price",
            "discount",
            "tax",
            "total",
        ]
        # La TVA est calculée par le serveur à partir des paramètres de l'organisation.
        read_only_fields = ["id", "tax", "total"]
        extra_kwargs = {
            "quantity": {"min_value": 1},
            "unit_price": {"required": False, "min_value": 0},
            "discount": {"min_value": 0},
        }

    def validate_product(self, product):
        if not product.is_active:
            raise serializers.ValidationError(f"Le produit {product.name} est désactivé.")
        return product


class SaleSerializer(TenantScopedSerializerMixin, serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, allow_empty=False)
    customer_name = serializers.SerializerMethodField()
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_customer_name(self, obj):
        return obj.customer.name if obj.customer_id else None

    class Meta:
        model = Sale
        fields = [
            "id",
            "customer",
            "customer_name",
            "warehouse",
            "warehouse_name",
            "reference",
            "status",
            "sale_date",
            "subtotal",
            "discount",
            "tax",
            "total",
            "items",
            "created_at",
            "completed_at",
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
            "completed_at",
        ]
        extra_kwargs = {"sale_date": {"required": False}}

    def validate_sale_date(self, value):
        return validate_document_date(value, self.context["request"].organization)

    def validate_warehouse(self, warehouse):
        if not self.context["request"].membership.can_access_warehouse(warehouse):
            raise WarehouseForbidden()
        return ensure_active_warehouse(warehouse)

    @transaction.atomic
    def create(self, validated):
        items = validated.pop("items")
        validated.pop("organization", None)
        request = self.context["request"]
        sale_date = validated.pop("sale_date", None) or organization_today(request.organization)
        sale = Sale.objects.create(
            organization=request.organization,
            reference=next_reference(request.organization, "SALE"),
            created_by=request.user,
            sale_date=sale_date,
            **validated,
        )
        for item in items:
            product = item["product"]
            item.setdefault("unit_price", product.selling_price)
            SaleItem.objects.create(sale=sale, **item)
        recompute_sale_totals(sale)
        return sale
