from django.db import transaction
from django.db.models import Sum
from django.db.models.functions import Coalesce

from apps.audit.services import AuditAction, write_audit
from apps.core.permissions import require_permission
from apps.core.viewsets import AuditedViewSetMixin, TenantViewSet
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
    queryset = Product.objects.select_related("category").annotate(
        total_stock=Coalesce(Sum("positions__quantity"), 0)
    )
    search_fields = ["name", "sku", "barcode"]
    filterset_fields = ["is_active", "category"]
    ordering_fields = ["name", "sku", "created_at", "total_stock"]

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
        super().perform_update(serializer)
