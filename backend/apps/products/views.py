from django.db import transaction
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q, Sum
from django.db.models.functions import Coalesce

from apps.audit.services import AuditAction, write_audit
from apps.core.permissions import require_permission
from apps.core.viewsets import AuditedViewSetMixin, TenantViewSet
from apps.inventory.blind import hidden_stock_warehouse_ids
from apps.inventory.services import initialize_stock
from apps.products.models import Category, Product
from apps.products.serializers import CategorySerializer, ProductSerializer


class CategoryViewSet(AuditedViewSetMixin, TenantViewSet):
    serializer_class = CategorySerializer
    queryset = Category.objects.all()
    search_fields = ["name"]
    filterset_fields = ["is_active"]

    def get_permissions(self):
        code = "products.view" if self.action in ("list", "retrieve") else "products.create"
        if self.action in ("update", "partial_update"):
            code = "products.update"
        if self.action == "destroy":
            code = "products.deactivate"
        return [require_permission(code)()]


class ProductViewSet(AuditedViewSetMixin, TenantViewSet):
    serializer_class = ProductSerializer
    queryset = Product.objects.select_related("category")
    search_fields = ["name", "sku", "barcode"]
    filterset_fields = ["is_active", "category"]
    ordering_fields = ["name", "sku", "created_at", "total_stock"]

    def get_queryset(self):
        # Stock total limité aux dépôts du membre : un membre restreint ne doit
        # pas déduire le stock des autres boutiques.
        qs = super().get_queryset()
        membership = getattr(self.request, "membership", None)
        condition = Q()
        if membership is not None and membership.role not in {"OWNER", "ADMINISTRATOR"}:
            ids = membership.warehouse_ids()
            if ids:
                condition &= Q(positions__warehouse_id__in=ids)
        extra = {"filter": condition} if condition else {}
        return qs.annotate(total_stock=Coalesce(Sum("positions__quantity", **extra), 0))

    def get_serializer_context(self):
        # Inventaire ouvert : ceux qui comptent ne reçoivent pas le stock total
        # (un total partiel afficherait à tort une rupture).
        context = super().get_serializer_context()
        context["stock_hidden"] = bool(hidden_stock_warehouse_ids(getattr(self.request, "membership", None)))
        return context

    def get_permissions(self):
        mapping = {
            "list": "products.view",
            "retrieve": "products.view",
            "create": "products.create",
            "update": "products.update",
            "partial_update": "products.update",
            "destroy": "products.deactivate",
        }
        return [require_permission(mapping.get(self.action, "products.view"))()]

    @transaction.atomic
    def perform_create(self, serializer):
        qty = serializer.validated_data.pop("initial_quantity", None)
        warehouse = serializer.validated_data.pop("initial_warehouse", None)
        product = serializer.save(
            organization=self.request.organization, parent=None, is_variant=False
        )
        if qty:
            initialize_stock(
                organization=self.request.organization,
                product=product,
                warehouse=warehouse,
                quantity=qty,
                user=self.request.user,
            )
        write_audit(self.request, action=AuditAction.CREATE, entity=product)

    def perform_update(self, serializer):
        serializer.validated_data.pop("initial_quantity", None)
        serializer.validated_data.pop("initial_warehouse", None)
        # Changer un prix existant est réservé à prices.update : sinon un
        # gestionnaire pourrait baisser le prix catalogue pour contourner son
        # plafond de remise, puis le remettre.
        product = serializer.instance
        changes_price = any(
            field in serializer.validated_data and serializer.validated_data[field] != getattr(product, field)
            for field in ("selling_price", "purchase_price")
        )
        if changes_price and not self.request.membership.has_perm("prices.update"):
            raise PermissionDenied("Vous n'êtes pas autorisé à modifier les prix.")
        super().perform_update(serializer)
