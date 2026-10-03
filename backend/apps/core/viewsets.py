from rest_framework import viewsets

from apps.core.exceptions import WarehouseForbidden


class TenantViewSet(viewsets.ModelViewSet):
    org_field = "organization"

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.filter(**{self.org_field: self.request.organization})

    def perform_create(self, serializer):
        serializer.save(organization=self.request.organization)


def assert_warehouse_allowed(request, warehouse):
    membership = request.membership
    if not membership.can_access_warehouse(warehouse):
        raise WarehouseForbidden()
