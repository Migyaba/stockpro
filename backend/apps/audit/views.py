from rest_framework import mixins, viewsets

from apps.audit.models import AuditLog
from apps.audit.serializers import AuditLogSerializer
from apps.core.permissions import require_permission
from apps.reports.periods import parse_period


class AuditLogViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Journal d'audit en lecture seule (§44-45) : Owner et Administrator."""

    serializer_class = AuditLogSerializer
    permission_classes = [require_permission("audit.view")]
    filterset_fields = ["action", "entity_type", "user"]
    search_fields = ["entity_label", "entity_id", "user__email", "user__first_name", "user__last_name"]

    def get_queryset(self):
        qs = AuditLog.objects.filter(organization=self.request.organization).select_related("user")
        params = self.request.query_params
        if params.get("date_from") or params.get("date_to"):
            date_from, date_to = parse_period(params, self.request.organization)
            qs = qs.filter(created_at__date__range=(date_from, date_to))
        return qs
