from rest_framework.decorators import action
from rest_framework.response import Response

from apps.audit.services import AuditAction, write_audit
from apps.core.permissions import require_permission
from apps.core.viewsets import TenantViewSet
from apps.sales.models import Sale
from apps.sales.serializers import SaleSerializer
from apps.sales.services import cancel_sale, complete_sale


class SaleViewSet(TenantViewSet):
    serializer_class = SaleSerializer
    queryset = Sale.objects.select_related("customer", "warehouse").prefetch_related("items__product")
    filterset_fields = ["status", "warehouse", "customer"]
    search_fields = ["reference"]

    def get_permissions(self):
        mapping = {
            "list": "sales.view",
            "retrieve": "sales.view",
            "create": "sales.create",
            "complete": "sales.validate",
            "cancel": "sales.cancel",
        }
        return [require_permission(mapping.get(self.action, "sales.view"))()]

    def get_queryset(self):
        qs = super().get_queryset()
        ids = self.request.membership.warehouse_ids()
        if ids and self.request.membership.role not in {"OWNER", "ADMINISTRATOR"}:
            qs = qs.filter(warehouse_id__in=ids)
        return qs

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        sale = complete_sale(self.get_object(), request.user, request.membership)
        write_audit(request, action=AuditAction.VALIDATE, entity=sale)
        return Response(self.get_serializer(sale).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        sale = cancel_sale(self.get_object(), request.user, request.membership)
        write_audit(request, action=AuditAction.CANCEL, entity=sale)
        return Response(self.get_serializer(sale).data)
