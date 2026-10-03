from rest_framework.decorators import action
from rest_framework.response import Response

from apps.audit.services import AuditAction, write_audit
from apps.core.exceptions import InvalidStateTransition
from apps.core.permissions import require_permission
from apps.core.viewsets import TenantViewSet
from apps.inventory.models import Warehouse
from apps.inventory.services import initialize_stock
from apps.products.models import Category, Product
from apps.products.serializers import CategorySerializer, ProductSerializer


class CategoryViewSet(TenantViewSet):
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

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])


class ProductViewSet(TenantViewSet):
    serializer_class = ProductSerializer
    queryset = Product.objects.select_related("category").all()
    search_fields = ["name", "sku", "barcode"]
    filterset_fields = ["is_active", "category"]
    ordering_fields = ["name", "sku", "created_at"]

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

    def perform_create(self, serializer):
        qty = serializer.validated_data.pop("initial_quantity", None)
        warehouse_id = serializer.validated_data.pop("initial_warehouse", None)
        product = serializer.save(
            organization=self.request.organization, parent=None, is_variant=False
        )
        if qty:
            if not warehouse_id:
                raise InvalidStateTransition("Indiquez le dépôt pour le stock initial.")
            warehouse = Warehouse.objects.get(
                id=warehouse_id, organization=self.request.organization
            )
            initialize_stock(
                organization=self.request.organization,
                product=product,
                warehouse=warehouse,
                quantity=qty,
                user=self.request.user,
            )
        write_audit(self.request, action=AuditAction.CREATE, entity=product)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])
