from django.conf import settings
from django.db import models

from apps.core.models import OrganizationOwnedModel


class AuditAction(models.TextChoices):
    CREATE = "CREATE", "A créé"
    UPDATE = "UPDATE", "A modifié"
    DELETE = "DELETE", "A supprimé"
    VALIDATE = "VALIDATE", "A validé"
    CANCEL = "CANCEL", "A annulé"
    LOGIN = "LOGIN", "S'est connecté"
    LOGOUT = "LOGOUT", "S'est déconnecté"
    STOCK_ADJUSTMENT = "STOCK_ADJUSTMENT", "A ajusté le stock"
    RECEIVE = "RECEIVE", "A réceptionné"


class AuditLog(OrganizationOwnedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    action = models.CharField(max_length=32, choices=AuditAction.choices)
    entity_type = models.CharField(max_length=64)
    entity_id = models.CharField(max_length=64)
    # Libellé lisible au moment de l'action (V-000012, nom du produit…) :
    # le journal reste parlant même si l'objet est renommé ensuite.
    entity_label = models.CharField(max_length=255, blank=True)
    old_values = models.JSONField(null=True, blank=True)
    new_values = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["organization", "-created_at"], name="audit_org_created_idx")]
