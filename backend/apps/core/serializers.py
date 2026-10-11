from rest_framework import serializers


def _is_tenant_model(model):
    return any(f.name == "organization" for f in model._meta.get_fields())


class TenantScopedSerializerMixin:
    """Restreint les relations écrites (FK) à l'organisation de la requête.

    Sans cela, un identifiant d'une autre organisation serait accepté et ses
    données (nom, prix…) renvoyées dans la réponse.
    """

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get("request")
        organization = getattr(request, "organization", None)
        for field in fields.values():
            target = getattr(field, "child_relation", field)
            if not isinstance(target, serializers.RelatedField) or target.read_only:
                continue
            queryset = target.queryset
            if queryset is None or not _is_tenant_model(queryset.model):
                continue
            target.queryset = (
                queryset.filter(organization=organization) if organization else queryset.none()
            )
        return fields
