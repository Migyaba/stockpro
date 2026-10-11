from rest_framework import serializers

from apps.core.exceptions import WarehouseForbidden
from apps.core.serializers import TenantScopedSerializerMixin
from apps.inventory.models import Warehouse
from apps.products.models import Category, Product


def _organization(serializer):
    return serializer.context["request"].organization


class CategorySerializer(TenantScopedSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "parent", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_name(self, value):
        qs = Category.objects.filter(organization=_organization(self), name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Une catégorie porte déjà ce nom.")
        return value


class ProductSerializer(TenantScopedSerializerMixin, serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    initial_quantity = serializers.IntegerField(write_only=True, required=False, min_value=0)
    initial_warehouse = serializers.PrimaryKeyRelatedField(
        queryset=Warehouse.objects.all(), write_only=True, required=False
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "category_name",
            "sku",
            "barcode",
            "name",
            "description",
            "unit",
            "purchase_price",
            "selling_price",
            "minimum_stock",
            "maximum_stock",
            "image",
            "is_active",
            "created_at",
            "updated_at",
            "initial_quantity",
            "initial_warehouse",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {
            "purchase_price": {"min_value": 0},
            "selling_price": {"min_value": 0},
        }

    def validate(self, attrs):
        organization = _organization(self)
        active = Product.objects.filter(organization=organization, is_active=True)
        if self.instance:
            active = active.exclude(pk=self.instance.pk)
        sku = attrs.get("sku")
        if sku and active.filter(sku=sku).exists():
            raise serializers.ValidationError({"sku": "Un produit actif utilise déjà ce SKU."})
        barcode = attrs.get("barcode")
        if barcode and active.filter(barcode=barcode).exists():
            raise serializers.ValidationError(
                {"barcode": "Un produit actif utilise déjà ce code-barres."}
            )
        if attrs.get("initial_quantity"):
            warehouse = attrs.get("initial_warehouse")
            if warehouse is None:
                raise serializers.ValidationError(
                    {"initial_warehouse": "Indiquez le dépôt pour le stock initial."}
                )
            if not self.context["request"].membership.can_access_warehouse(warehouse):
                raise WarehouseForbidden()
        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        membership = getattr(request, "membership", None)
        if membership and not membership.has_perm("prices.view_cost"):
            data.pop("purchase_price", None)
        return data
