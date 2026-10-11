from apps.core.permissions import require_permission
from apps.core.viewsets import AuditedViewSetMixin, TenantViewSet
from apps.customers.models import Customer
from apps.customers.serializers import CustomerSerializer


class CustomerViewSet(AuditedViewSetMixin, TenantViewSet):
    serializer_class = CustomerSerializer
    queryset = Customer.objects.all()
    search_fields = ["name", "phone", "email"]
    filterset_fields = ["is_active"]

    def get_permissions(self):
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [require_permission("sales.view")()]
        return [require_permission("sales.create")()]
