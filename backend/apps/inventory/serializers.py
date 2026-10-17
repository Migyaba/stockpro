from django.db import transaction
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.core.exceptions import WarehouseForbidden
from apps.core.serializers import TenantScopedSerializerMixin, ensure_active_warehouse
from apps.inventory.models import (
    OPEN_INVENTORY_STATUSES,
    InventoryCount,
    InventoryLine,
    StockMovement,
    StockPosition,
    Transfer,
    TransferItem,
    Warehouse,
)
from apps.inventory.stock_levels import stock_level
from apps.products.serializers import ProductSerializer


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
    product = ProductSerializer(read_only=True)
    warehouse = WarehouseSerializer(read_only=True)
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

    @extend_schema_field(serializers.ChoiceField(choices=["NORMAL", "LOW", "OUT_OF_STOCK", "COUNTING"]))
    def get_status(self, obj):
        if self._hidden(obj):
            return "COUNTING"
        return stock_level(obj.quantity, obj.product.minimum_stock)

    def _hidden(self, obj):
        return obj.warehouse_id in self.context.get("hidden_warehouses", ())

    def to_representation(self, obj):
        data = super().to_representation(obj)
        if self._hidden(obj):
            # Inventaire en cours dans ce dépôt : quantité non communiquée à
            # ceux qui comptent (comptage à l'aveugle).
            data["quantity"] = None
        if self.context.get("hidden_warehouses") and isinstance(data.get("product"), dict):
            # Le total tous dépôts permettrait de retrouver la quantité masquée.
            data["product"]["total_stock"] = None
        return data


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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        membership = getattr(self.context.get("request"), "membership", None)
        if membership and not membership.has_perm("prices.view_cost"):
            data.pop("unit_cost", None)
        return data


class TransferItemSerializer(TenantScopedSerializerMixin, serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = TransferItem
        fields = ["id", "product", "product_name", "quantity"]
        read_only_fields = ["id"]
        extra_kwargs = {"quantity": {"min_value": 1}}

    def validate_product(self, product):
        # §19.2 : un produit désactivé ne peut plus entrer dans une nouvelle opération.
        if not product.is_active:
            raise serializers.ValidationError(f"Le produit {product.name} est désactivé.")
        return product


class TransferSerializer(TenantScopedSerializerMixin, serializers.ModelSerializer):
    items = TransferItemSerializer(many=True, allow_empty=False)
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

    def validate(self, attrs):
        source, destination = attrs.get("source"), attrs.get("destination")
        if source and destination and source.pk == destination.pk:
            raise serializers.ValidationError(
                {"destination": "Les dépôts source et destination doivent être distincts."}
            )
        membership = self.context["request"].membership
        for warehouse in (source, destination):
            if warehouse and not membership.can_access_warehouse(warehouse):
                raise WarehouseForbidden()
        ensure_active_warehouse(source, "source")
        ensure_active_warehouse(destination, "destination")
        return attrs

    @transaction.atomic
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


class InventoryCountSerializer(TenantScopedSerializerMixin, serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True, default=None)
    validated_by_name = serializers.CharField(source="validated_by.full_name", read_only=True, default=None)
    stats = serializers.SerializerMethodField()

    class Meta:
        model = InventoryCount
        fields = [
            "id",
            "reference",
            "warehouse",
            "warehouse_name",
            "category",
            "category_name",
            "status",
            "notes",
            "stats",
            "created_by_name",
            "started_at",
            "validated_by_name",
            "validated_at",
            "created_at",
        ]
        read_only_fields = ["id", "reference", "status", "started_at", "validated_at", "created_at"]

    @extend_schema_field(serializers.DictField())
    def get_stats(self, obj):
        # Annoté par le viewset (sinon calculé : création, actions).
        lines = getattr(obj, "lines_total", None)
        if lines is None:
            qs = obj.lines.all()
            lines = qs.count()
            counted = qs.filter(counted_quantity__isnull=False).count()
            differences = sum(1 for line in qs.filter(counted_quantity__isnull=False) if line.difference)
        else:
            counted, differences = obj.lines_counted, obj.lines_with_difference
        stats = {"lines": lines, "counted": counted, "uncounted": lines - counted}
        membership = getattr(self.context.get("request"), "membership", None)
        # Comptage à l'aveugle : les écarts ne sont visibles que de ceux qui valident.
        if membership and membership.has_perm("inventory.validate"):
            stats["differences"] = differences
        return stats

    def validate_warehouse(self, warehouse):
        request = self.context["request"]
        if not request.membership.can_access_warehouse(warehouse):
            raise WarehouseForbidden()
        ensure_active_warehouse(warehouse)
        open_inventory = InventoryCount.objects.filter(
            warehouse=warehouse, status__in=OPEN_INVENTORY_STATUSES
        ).first()
        if open_inventory:
            raise serializers.ValidationError(
                f"L'inventaire {open_inventory.reference} est déjà en cours sur ce dépôt."
            )
        return warehouse

    def create(self, validated):
        from apps.organizations.references import next_reference

        validated.pop("organization", None)
        request = self.context["request"]
        return InventoryCount.objects.create(
            organization=request.organization,
            reference=next_reference(request.organization, "INVENTORY"),
            created_by=request.user,
            **validated,
        )


class InventoryLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    product_barcode = serializers.CharField(source="product.barcode", read_only=True)
    unit = serializers.CharField(source="product.unit", read_only=True)
    counted_by_name = serializers.CharField(source="counted_by.full_name", read_only=True, default=None)
    difference = serializers.IntegerField(read_only=True, allow_null=True)

    class Meta:
        model = InventoryLine
        fields = [
            "id",
            "product",
            "product_name",
            "product_sku",
            "product_barcode",
            "unit",
            "expected_quantity",
            "counted_quantity",
            "difference",
            "counted_by_name",
            "counted_at",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        membership = getattr(self.context.get("request"), "membership", None)
        if not (membership and membership.has_perm("inventory.validate")):
            # Comptage à l'aveugle : le compteur ne voit pas le stock attendu.
            data.pop("expected_quantity", None)
            data.pop("difference", None)
        else:
            current = self.context.get("current_stock", {}).get(instance.product_id)
            if current is not None:
                # Stock modifié depuis le démarrage (vente, réception…) : à surveiller en revue.
                data["stock_changed"] = current != instance.expected_quantity
        return data


class CountEntrySerializer(serializers.Serializer):
    """Un comptage : produit ou code (SKU / code-barres), quantité absolue ou incrément."""

    product = serializers.UUIDField(required=False)
    code = serializers.CharField(required=False, max_length=64)
    counted_quantity = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    add = serializers.IntegerField(required=False, min_value=1, max_value=100_000)

    def validate(self, attrs):
        if bool(attrs.get("product")) == bool(attrs.get("code")):
            raise serializers.ValidationError("Indiquez soit le produit, soit son code.")
        if ("counted_quantity" in attrs) == ("add" in attrs):
            raise serializers.ValidationError("Indiquez soit la quantité comptée, soit un incrément.")
        return attrs


class RecordCountsSerializer(serializers.Serializer):
    lines = CountEntrySerializer(many=True, allow_empty=False, max_length=1000)
