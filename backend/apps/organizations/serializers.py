from rest_framework import serializers

from apps.organizations.models import Organization


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = [
            "id",
            "name",
            "slug",
            "logo",
            "address",
            "phone",
            "email",
            "country",
            "currency",
            "currency_exponent",
            "timezone",
            "language",
            "date_format",
            "tax_enabled",
            "tax_rate_bps",
            "prices_include_tax",
            "max_discount_percent_manager",
            "status",
            "trial_ends_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "slug",
            "currency_exponent",
            "status",
            "trial_ends_at",
            "created_at",
        ]


class DashboardSaleSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    reference = serializers.CharField()
    status = serializers.CharField()
    total = serializers.IntegerField()
    sale_date = serializers.DateField()


class DashboardSerializer(serializers.Serializer):
    products_count = serializers.IntegerField()
    stock_value = serializers.IntegerField()
    sales_today_count = serializers.IntegerField()
    sales_today_total = serializers.IntegerField()
    low_stock_count = serializers.IntegerField()
    out_of_stock_count = serializers.IntegerField()
    warehouses_count = serializers.IntegerField()
    recent_sales = DashboardSaleSerializer(many=True)
