from django.utils import timezone
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.organizations.references import next_reference
from apps.sales.models import Sale, SaleItem
from apps.sales.services import recompute_sale_totals


class SaleItemSerializer(serializers.ModelSerializer):
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
        read_only_fields = ["id", "total"]
        extra_kwargs = {"unit_price": {"required": False}}


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
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

    def create(self, validated):
        items = validated.pop("items")
        validated.pop("organization", None)
        request = self.context["request"]
        sale_date = validated.pop("sale_date", None) or timezone.localdate()
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
