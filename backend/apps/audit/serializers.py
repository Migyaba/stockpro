from rest_framework import serializers

from apps.audit.models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    action_label = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "created_at",
            "user_name",
            "action",
            "action_label",
            "entity_type",
            "entity_id",
            "entity_label",
            "old_values",
            "new_values",
            "ip_address",
        ]
        read_only_fields = fields

    def get_user_name(self, obj) -> str:
        if obj.user is None:
            return "Système"
        return obj.user.full_name or obj.user.email
