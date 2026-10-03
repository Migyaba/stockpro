from django.db.models import F
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.audit.services import AuditAction, write_audit
from apps.core.exceptions import InvalidStateTransition
from apps.core.permissions import require_permission
from apps.core.viewsets import TenantViewSet
from apps.inventory.models import StockMovement, StockPosition, Transfer, TransferStatus, Warehouse
from apps.inventory.serializers import (
    StockMovementSerializer,
    StockPositionSerializer,
    TransferSerializer,
    WarehouseSerializer,
)
from apps.inventory.transfers import complete_transfer


class WarehouseViewSet(TenantViewSet):
    serializer_class = WarehouseSerializer
    queryset = Warehouse.objects.all()
    search_fields = ["name", "code", "city"]
    filterset_fields = ["is_active"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [require_permission("stock.view")()]
        return [require_permission("settings.update")()]

    def get_queryset(self):
        qs = super().get_queryset()
        ids = self.request.membership.warehouse_ids()
        role = self.request.membership.role
        if ids and role not in {"OWNER", "ADMINISTRATOR"}:
            qs = qs.filter(id__in=ids)
        return qs

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])


class StockViewSet(TenantViewSet):
    serializer_class = StockPositionSerializer
    queryset = StockPosition.objects.select_related("product", "warehouse").all()
    http_method_names = ["get", "head", "options"]
    filterset_fields = ["warehouse", "product"]
    search_fields = ["product__name", "product__sku", "product__barcode"]

    def get_permissions(self):
        return [require_permission("stock.view")()]

    def get_queryset(self):
        qs = super().get_queryset()
        ids = self.request.membership.warehouse_ids()
        if ids and self.request.membership.role not in {"OWNER", "ADMINISTRATOR"}:
            qs = qs.filter(warehouse_id__in=ids)
        status = self.request.query_params.get("status")
        if status == "LOW":
            qs = qs.filter(quantity__lte=F("product__minimum_stock"))
        elif status == "OUT_OF_STOCK":
            qs = qs.filter(quantity=0)
        return qs


class MovementViewSet(TenantViewSet):
    serializer_class = StockMovementSerializer
    queryset = StockMovement.objects.select_related("product", "warehouse", "created_by").all()
    http_method_names = ["get", "head", "options"]
    filterset_fields = ["warehouse", "product", "type"]

    def get_permissions(self):
        return [require_permission("stock.view")()]


class TransferViewSet(TenantViewSet):
    serializer_class = TransferSerializer
    queryset = Transfer.objects.prefetch_related("items__product").select_related(
        "source", "destination"
    )
    filterset_fields = ["status", "source", "destination"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [require_permission("stock.view")()]
        return [require_permission("stock.transfer")()]

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        transfer = self.get_object()
        complete_transfer(transfer, request.user, request.membership)
        write_audit(request, action=AuditAction.VALIDATE, entity=transfer)
        return Response(self.get_serializer(transfer).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status != TransferStatus.DRAFT:
            from apps.core.exceptions import InvalidStateTransition

            raise InvalidStateTransition("Seul un brouillon peut être annulé.")
        transfer.status = TransferStatus.CANCELLED
        transfer.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(transfer).data)
