from rest_framework import serializers

from apps.suppliers.models import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            "id",
            "name",
            "contact_name",
            "email",
            "phone",
            "address",
            "city",
            "country",
            "notes",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
