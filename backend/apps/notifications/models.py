from django.db import models

from apps.core.models import OrganizationOwnedModel


class NotificationKind(models.TextChoices):
    STOCK_LOW = "STOCK_LOW", "Stock faible"
    STOCK_OUT = "STOCK_OUT", "Rupture de stock"
    PURCHASE_RECEIVED = "PURCHASE_RECEIVED", "Achat réceptionné"
    TRANSFER_COMPLETED = "TRANSFER_COMPLETED", "Transfert validé"
    INVENTORY_REVIEW = "INVENTORY_REVIEW", "Inventaire à valider"


class Notification(OrganizationOwnedModel):
    """Notification interne (§37), une ligne par destinataire."""

    recipient = models.ForeignKey(
        "accounts.Membership", on_delete=models.CASCADE, related_name="notifications"
    )
    kind = models.CharField(max_length=32, choices=NotificationKind.choices)
    message = models.CharField(max_length=255)
    link = models.CharField(max_length=255, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["recipient", "read_at"], name="notif_recipient_read_idx")]
