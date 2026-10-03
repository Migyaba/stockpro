from apps.core.permissions import require_permission
from apps.core.viewsets import TenantViewSet
from apps.suppliers.models import Supplier
from apps.suppliers.serializers import SupplierSerializer


class SupplierViewSet(TenantViewSet):
    serializer_class = SupplierSerializer
    queryset = Supplier.objects.all()
    search_fields = ["name", "phone", "email"]
    filterset_fields = ["is_active"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [require_permission("purchases.view")()]
        return [require_permission("purchases.create")()]

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])
