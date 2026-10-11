from rest_framework.decorators import action
from rest_framework.response import Response

from apps.audit.services import AuditAction, write_audit
from apps.core.idempotency import idempotent
from apps.core.permissions import require_permission
from apps.core.viewsets import TenantViewSet, restrict_to_allowed_warehouses
from apps.purchases.models import Purchase
from apps.purchases.serializers import PurchaseSerializer, ReceiveSerializer
from apps.purchases.services import cancel_purchase, confirm_purchase, receive_purchase


class PurchaseViewSet(TenantViewSet):
    serializer_class = PurchaseSerializer
    queryset = Purchase.objects.select_related("supplier", "warehouse").prefetch_related(
        "items__product"
    )
    filterset_fields = ["status", "warehouse", "supplier"]
    search_fields = ["reference"]
    # Un achat ne se modifie ni ne se supprime : il évolue via confirm/receive/cancel.
    http_method_names = ["get", "post", "head", "options"]

    def get_permissions(self):
        mapping = {
            "list": "purchases.view",
            "retrieve": "purchases.view",
            "create": "purchases.create",
            "confirm": "purchases.confirm",
            "receive": "purchases.receive",
            "cancel": "purchases.confirm",
        }
        return [require_permission(mapping.get(self.action, "purchases.view"))()]

    def get_queryset(self):
        return restrict_to_allowed_warehouses(super().get_queryset(), self.request.membership)

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        purchase = confirm_purchase(self.get_object())
        write_audit(request, action=AuditAction.VALIDATE, entity=purchase)
        return Response(self.get_serializer(purchase).data)

    @action(detail=True, methods=["post"])
    @idempotent
    def receive(self, request, pk=None):
        serializer = ReceiveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        receipt = receive_purchase(
            self.get_object(), serializer.validated_data["lines"], request.user, request.membership
        )
        write_audit(request, action=AuditAction.RECEIVE, entity=receipt.purchase)
        purchase = Purchase.objects.get(pk=receipt.purchase_id)
        return Response(self.get_serializer(purchase).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        purchase = cancel_purchase(self.get_object())
        write_audit(request, action=AuditAction.CANCEL, entity=purchase)
        return Response(self.get_serializer(purchase).data)
