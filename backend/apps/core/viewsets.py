from django.db import transaction
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


def restrict_to_allowed_warehouses(queryset, membership, field="warehouse_id"):
    """Limite un queryset aux dépôts affectés au membre (Owner/Admin voient tout)."""
    if membership.role in {"OWNER", "ADMINISTRATOR"}:
        return queryset
    ids = membership.warehouse_ids()
    if not ids:
        return queryset
    return queryset.filter(**{f"{field}__in": ids})


class AuditedViewSetMixin:
    """Journalise création, modification (anciennes/nouvelles valeurs des champs
    modifiés uniquement) et désactivation, dans la transaction de l'opération."""

    def perform_create(self, serializer):
        from apps.audit.services import AuditAction, write_audit

        with transaction.atomic():
            super().perform_create(serializer)
            write_audit(self.request, action=AuditAction.CREATE, entity=serializer.instance)

    def perform_update(self, serializer):
        from apps.audit.services import AuditAction, diff, snapshot, write_audit

        fields = list(serializer.validated_data)
        before = snapshot(serializer.instance, fields)
        with transaction.atomic():
            super().perform_update(serializer)
            old, new = diff(before, snapshot(serializer.instance, fields))
            if new:
                write_audit(
                    self.request,
                    action=AuditAction.UPDATE,
                    entity=serializer.instance,
                    old_values=old,
                    extra=new,
                )

    def perform_destroy(self, instance):
        from apps.audit.services import AuditAction, write_audit

        with transaction.atomic():
            if hasattr(instance, "is_active"):
                # Désactivation logique : l'historique (ventes, mouvements) reste intact.
                instance.is_active = False
                instance.save(update_fields=["is_active", "updated_at"])
                write_audit(
                    self.request,
                    action=AuditAction.UPDATE,
                    entity=instance,
                    old_values={"is_active": True},
                    extra={"is_active": False},
                )
            else:
                super().perform_destroy(instance)
                write_audit(self.request, action=AuditAction.DELETE, entity=instance)
