from django.db import models

from apps.core.models import OrganizationOwnedModel


class NotificationKind(models.TextChoices):
    STOCK_LOW = "STOCK_LOW", "Stock faible"
    STOCK_OUT = "STOCK_OUT", "Rupture de stock"
    PURCHASE_RECEIVED = "PURCHASE_RECEIVED", "Achat réceptionné"
    TRANSFER_COMPLETED = "TRANSFER_COMPLETED", "Transfert validé"
    INVENTORY_REVIEW = "INVENTORY_REVIEW", "Inventaire à valider"


# Permission requise pour recevoir chaque type (dépôt concerné en plus).
KIND_PERMISSIONS = {
    NotificationKind.STOCK_LOW: "purchases.create",
    NotificationKind.STOCK_OUT: "purchases.create",
    NotificationKind.PURCHASE_RECEIVED: "purchases.view",
    NotificationKind.TRANSFER_COMPLETED: "stock.view",
    NotificationKind.INVENTORY_REVIEW: "inventory.validate",
}

# Envoi par email par défaut : seulement ce qui appelle une action. Les
# événements purement informatifs restent dans la cloche, sauf choix du membre.
EMAIL_DEFAULTS = {
    NotificationKind.STOCK_LOW: True,
    NotificationKind.STOCK_OUT: True,
    NotificationKind.PURCHASE_RECEIVED: False,
    NotificationKind.TRANSFER_COMPLETED: False,
    NotificationKind.INVENTORY_REVIEW: True,
}

KIND_DESCRIPTIONS = {
    NotificationKind.STOCK_LOW: "Un produit passe sous son seuil d'alerte dans un de vos dépôts.",
    NotificationKind.STOCK_OUT: "Un produit est épuisé dans un de vos dépôts.",
    NotificationKind.PURCHASE_RECEIVED: "Une réception de marchandise est enregistrée.",
    NotificationKind.TRANSFER_COMPLETED: "Un transfert entre dépôts est validé.",
    NotificationKind.INVENTORY_REVIEW: "Un inventaire terminé attend votre validation.",
}


def wants_email(membership, kind):
    choice = (membership.email_notifications or {}).get(kind)
    return EMAIL_DEFAULTS.get(kind, False) if choice is None else bool(choice)


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
