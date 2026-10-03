from apps.core.permissions import require_permission
from apps.core.viewsets import TenantViewSet
from apps.customers.models import Customer
from apps.customers.serializers import CustomerSerializer


class CustomerViewSet(TenantViewSet):
    serializer_class = CustomerSerializer
    queryset = Customer.objects.all()
    search_fields = ["name", "phone", "email"]
    filterset_fields = ["is_active"]

    def get_permissions(self):
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [require_permission("sales.view")()]
        return [require_permission("sales.create")()]

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])
