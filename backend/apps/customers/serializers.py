from rest_framework import serializers

from apps.customers.models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id",
            "name",
            "phone",
            "email",
            "address",
            "city",
            "notes",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
