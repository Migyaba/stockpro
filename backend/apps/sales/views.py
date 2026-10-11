from django.db.models import Count, Sum
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.audit.services import AuditAction, write_audit
from apps.core.idempotency import idempotent
from apps.core.permissions import require_permission
from apps.core.viewsets import TenantViewSet
from apps.sales.models import Sale, SaleStatus
from apps.sales.serializers import SaleSerializer
from apps.sales.services import cancel_sale, complete_sale


class SaleViewSet(TenantViewSet):
    serializer_class = SaleSerializer
    queryset = Sale.objects.select_related("customer", "warehouse").prefetch_related("items__product")
    filterset_fields = ["status", "warehouse", "customer"]
    search_fields = ["reference"]
    # Une vente ne se modifie ni ne se supprime : le stock ne bouge que via complete/cancel.
    http_method_names = ["get", "post", "head", "options"]

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

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Indicateurs de la liste (recherche et dépôt appliqués, tous statuts confondus)."""
        qs = self.filter_queryset(self.get_queryset()).order_by()
        counts = dict(qs.values_list("status").annotate(n=Count("id")))
        completed_total = qs.filter(status=SaleStatus.COMPLETED).aggregate(t=Sum("total"))["t"] or 0
        completed_count = counts.get(SaleStatus.COMPLETED, 0)
        return Response(
            {
                "count": sum(counts.values()),
                "completed_count": completed_count,
                "draft_count": counts.get(SaleStatus.DRAFT, 0),
                "cancelled_count": counts.get(SaleStatus.CANCELLED, 0),
                "completed_total": completed_total,
                "average_ticket": round(completed_total / completed_count) if completed_count else 0,
            }
        )

    @action(detail=True, methods=["post"])
    @idempotent
    def complete(self, request, pk=None):
        sale = complete_sale(self.get_object(), request.user, request.membership)
        write_audit(request, action=AuditAction.VALIDATE, entity=sale)
        return Response(self.get_serializer(sale).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        sale = cancel_sale(self.get_object(), request.user, request.membership)
        write_audit(request, action=AuditAction.CANCEL, entity=sale)
        return Response(self.get_serializer(sale).data)
