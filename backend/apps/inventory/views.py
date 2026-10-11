from django.db import transaction
from django.db.models import Count, F, Q
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.services import AuditAction, write_audit
from apps.core.exceptions import InvalidStateTransition
from apps.core.idempotency import idempotent
from apps.core.pagination import PageNumberPagination
from apps.core.permissions import require_permission
from apps.notifications.models import NotificationKind
from apps.notifications.services import notify
from apps.core.viewsets import AuditedViewSetMixin, TenantViewSet, restrict_to_allowed_warehouses
from apps.inventory.counts import (
    cancel_inventory,
    record_counts,
    reopen_counting,
    start_counting,
    submit_for_review,
    validate_inventory,
)
from apps.inventory.models import (
    InventoryCount,
    StockMovement,
    StockPosition,
    Transfer,
    TransferStatus,
    Warehouse,
)
from apps.inventory.serializers import (
    InventoryCountSerializer,
    InventoryLineSerializer,
    RecordCountsSerializer,
    StockMovementSerializer,
    StockPositionSerializer,
    TransferSerializer,
    WarehouseSerializer,
)
from apps.inventory.transfers import complete_transfer


class WarehouseViewSet(AuditedViewSetMixin, TenantViewSet):
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

    def get_queryset(self):
        return restrict_to_allowed_warehouses(super().get_queryset(), self.request.membership)


class TransferViewSet(TenantViewSet):
    serializer_class = TransferSerializer
    queryset = Transfer.objects.prefetch_related("items__product").select_related(
        "source", "destination"
    )
    filterset_fields = ["status", "source", "destination"]
    # Un transfert ne se modifie ni ne se supprime : il évolue via complete/cancel.
    http_method_names = ["get", "post", "head", "options"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [require_permission("stock.view")()]
        return [require_permission("stock.transfer")()]

    def get_queryset(self):
        qs = super().get_queryset()
        membership = self.request.membership
        ids = membership.warehouse_ids()
        if ids and membership.role not in {"OWNER", "ADMINISTRATOR"}:
            qs = qs.filter(Q(source_id__in=ids) | Q(destination_id__in=ids))
        return qs

    @action(detail=True, methods=["post"])
    @idempotent
    @transaction.atomic
    def complete(self, request, pk=None):
        transfer = complete_transfer(self.get_object(), request.user, request.membership)
        write_audit(request, action=AuditAction.VALIDATE, entity=transfer)
        notify(
            request.organization,
            permission="stock.view",
            kind=NotificationKind.TRANSFER_COMPLETED,
            message=(
                f"Le transfert {transfer.reference} ({transfer.source.name} → "
                f"{transfer.destination.name}) a été validé."
            ),
            link="/stock/transferts",
            warehouse=transfer.destination,
            exclude_user=request.user,
        )
        return Response(self.get_serializer(transfer).data)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def cancel(self, request, pk=None):
        with transaction.atomic():
            transfer = Transfer.objects.select_for_update().get(pk=self.get_object().pk)
            if transfer.status != TransferStatus.DRAFT:
                raise InvalidStateTransition("Seul un brouillon peut être annulé.")
            transfer.status = TransferStatus.CANCELLED
            transfer.save(update_fields=["status", "updated_at"])
        write_audit(request, action=AuditAction.CANCEL, entity=transfer)
        return Response(self.get_serializer(transfer).data)


class InventoryCountViewSet(TenantViewSet):
    serializer_class = InventoryCountSerializer
    queryset = InventoryCount.objects.select_related(
        "warehouse", "category", "created_by", "validated_by"
    ).annotate(
        lines_total=Count("lines"),
        lines_counted=Count("lines", filter=Q(lines__counted_quantity__isnull=False)),
        lines_with_difference=Count(
            "lines",
            filter=Q(lines__counted_quantity__isnull=False)
            & ~Q(lines__counted_quantity=F("lines__expected_quantity")),
        ),
    )
    filterset_fields = ["status", "warehouse"]
    # Un inventaire ne se modifie ni ne se supprime : il évolue par ses actions.
    http_method_names = ["get", "post", "head", "options"]

    PERMISSIONS = {
        "list": "inventory.view",
        "retrieve": "inventory.view",
        "create": "inventory.create",
        "start": "inventory.create",
        "cancel": "inventory.create",
        "lines": "inventory.count",
        "review": "inventory.count",
        "reopen": "inventory.count",
        "validate": "inventory.validate",
    }

    def get_permissions(self):
        code = self.PERMISSIONS.get(self.action, "inventory.view")
        if self.action == "lines" and self.request.method == "GET":
            code = "inventory.view"
        return [require_permission(code)()]

    def get_queryset(self):
        return restrict_to_allowed_warehouses(super().get_queryset(), self.request.membership)

    def _respond(self, inventory):
        return Response(self.get_serializer(self.get_queryset().get(pk=inventory.pk)).data)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def start(self, request, pk=None):
        return self._respond(start_counting(self.get_object(), request.membership))

    @action(detail=True, methods=["get", "post"])
    def lines(self, request, pk=None):
        inventory = self.get_object()
        context = {**self.get_serializer_context(), "current_stock": self._current_stock(inventory)}
        if request.method == "POST":
            payload = RecordCountsSerializer(data=request.data)
            payload.is_valid(raise_exception=True)
            updated = record_counts(
                inventory, payload.validated_data["lines"], request.user, request.membership
            )
            return Response(InventoryLineSerializer(updated, many=True, context=context).data)

        lines = inventory.lines.select_related("product", "counted_by").order_by("product__name")
        search = request.query_params.get("search")
        if search:
            lines = lines.filter(
                Q(product__name__icontains=search)
                | Q(product__sku__icontains=search)
                | Q(product__barcode__icontains=search)
            )
        state = request.query_params.get("state")
        if state == "counted":
            lines = lines.filter(counted_quantity__isnull=False)
        elif state == "uncounted":
            lines = lines.filter(counted_quantity__isnull=True)
        elif state == "difference" and request.membership.has_perm("inventory.validate"):
            lines = lines.filter(counted_quantity__isnull=False).exclude(
                counted_quantity=F("expected_quantity")
            )
        page = self.paginate_queryset(lines)
        return self.get_paginated_response(InventoryLineSerializer(page, many=True, context=context).data)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def review(self, request, pk=None):
        inventory = submit_for_review(self.get_object(), request.membership)
        notify(
            request.organization,
            permission="inventory.validate",
            kind=NotificationKind.INVENTORY_REVIEW,
            message=f"L'inventaire {inventory.reference} ({inventory.warehouse.name}) attend votre validation.",
            link=f"/inventaires/{inventory.id}",
            warehouse=inventory.warehouse,
            exclude_user=request.user,
        )
        return self._respond(inventory)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def reopen(self, request, pk=None):
        return self._respond(reopen_counting(self.get_object(), request.membership))

    @action(detail=True, methods=["post"])
    @idempotent
    @transaction.atomic
    def validate(self, request, pk=None):
        inventory = validate_inventory(self.get_object(), request.user, request.membership)
        write_audit(request, action=AuditAction.VALIDATE, entity=inventory)
        return self._respond(inventory)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def cancel(self, request, pk=None):
        inventory = cancel_inventory(self.get_object(), request.membership)
        write_audit(request, action=AuditAction.CANCEL, entity=inventory)
        return self._respond(inventory)

    def _current_stock(self, inventory):
        if not self.request.membership.has_perm("inventory.validate"):
            return {}
        return dict(
            StockPosition.objects.filter(
                organization=inventory.organization, warehouse=inventory.warehouse
            ).values_list("product_id", "quantity")
        )


class StockAlertView(APIView):
    """Alertes de stock (§36), calculées en direct sur les dépôts autorisés.

    - rupture : quantité 0 ;
    - stock faible : 0 < quantité ≤ seuil minimum du produit.
    """

    permission_classes = [require_permission("stock.view")]

    def get(self, request):
        positions = restrict_to_allowed_warehouses(
            StockPosition.objects.filter(organization=request.organization, product__is_active=True),
            request.membership,
        ).select_related("product", "warehouse")
        if request.query_params.get("warehouse"):
            positions = positions.filter(warehouse_id=request.query_params["warehouse"])
        out = Q(quantity=0)
        low = Q(quantity__gt=0, product__minimum_stock__gt=0, quantity__lte=F("product__minimum_stock"))
        counts = {"out": positions.filter(out).count(), "low": positions.filter(low).count()}
        kind = request.query_params.get("kind")
        alerts = positions.filter(out if kind == "out" else low if kind == "low" else out | low)
        # Ruptures d'abord, puis les stocks les plus entamés par rapport au seuil.
        alerts = alerts.order_by("quantity", "product__name")

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(alerts, request, view=self)
        results = [
            {
                "id": str(p.id),
                "kind": "out" if p.quantity == 0 else "low",
                "product": str(p.product_id),
                "product_name": p.product.name,
                "product_sku": p.product.sku,
                "unit": p.product.unit,
                "warehouse": str(p.warehouse_id),
                "warehouse_name": p.warehouse.name,
                "quantity": p.quantity,
                "minimum_stock": p.product.minimum_stock,
            }
            for p in page
        ]
        response = paginator.get_paginated_response(results)
        response.data["summary"] = counts
        return response
