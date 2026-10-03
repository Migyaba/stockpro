from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.inventory.models import StockMovement, StockPosition, Transfer, TransferItem, Warehouse


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = [
            "id",
            "name",
            "code",
            "address",
            "city",
            "manager_name",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class StockPositionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    minimum_stock = serializers.IntegerField(source="product.minimum_stock", read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = StockPosition
        fields = [
            "id",
            "product",
            "product_name",
            "product_sku",
            "warehouse",
            "warehouse_name",
            "quantity",
            "minimum_stock",
            "status",
            "updated_at",
        ]

    @extend_schema_field(serializers.ChoiceField(choices=["NORMAL", "LOW", "OUT_OF_STOCK"]))
    def get_status(self, obj):
        if obj.quantity == 0:
            return "OUT_OF_STOCK"
        if obj.product.minimum_stock and obj.quantity <= obj.product.minimum_stock:
            return "LOW"
        return "NORMAL"


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            "id",
            "product",
            "product_name",
            "warehouse",
            "warehouse_name",
            "type",
            "quantity",
            "unit_cost",
            "reference_type",
            "reference_id",
            "reason",
            "created_by_name",
            "created_at",
        ]


class TransferItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = TransferItem
        fields = ["id", "product", "product_name", "quantity"]
        read_only_fields = ["id"]


class TransferSerializer(serializers.ModelSerializer):
    items = TransferItemSerializer(many=True)
    source_name = serializers.CharField(source="source.name", read_only=True)
    destination_name = serializers.CharField(source="destination.name", read_only=True)

    class Meta:
        model = Transfer
        fields = [
            "id",
            "reference",
            "source",
            "source_name",
            "destination",
            "destination_name",
            "status",
            "notes",
            "items",
            "created_at",
            "completed_at",
        ]
        read_only_fields = ["id", "reference", "status", "created_at", "completed_at"]

    def create(self, validated):
        items = validated.pop("items")
        validated.pop("organization", None)
        org = self.context["request"].organization
        from apps.organizations.references import next_reference

        transfer = Transfer.objects.create(
            organization=org,
            reference=next_reference(org, "TRANSFER"),
            created_by=self.context["request"].user,
            **validated,
        )
        for item in items:
            TransferItem.objects.create(transfer=transfer, **item)
        return transfer
