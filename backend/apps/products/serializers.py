from rest_framework import serializers

from apps.products.models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "parent", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    initial_quantity = serializers.IntegerField(write_only=True, required=False, min_value=0)
    initial_warehouse = serializers.UUIDField(write_only=True, required=False)

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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        membership = getattr(request, "membership", None)
        if membership and not membership.has_perm("prices.view_cost"):
            data.pop("purchase_price", None)
        return data
