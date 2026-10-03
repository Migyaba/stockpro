from django.conf import settings
from django.db import models

from apps.core.models import OrganizationOwnedModel


class AuditAction(models.TextChoices):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    VALIDATE = "VALIDATE"
    CANCEL = "CANCEL"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    STOCK_ADJUSTMENT = "STOCK_ADJUSTMENT"
    RECEIVE = "RECEIVE"


class AuditLog(OrganizationOwnedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    action = models.CharField(max_length=32, choices=AuditAction.choices)
    entity_type = models.CharField(max_length=64)
    entity_id = models.CharField(max_length=64)
    old_values = models.JSONField(null=True, blank=True)
    new_values = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-created_at"]
