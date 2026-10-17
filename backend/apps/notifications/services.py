from django.db import transaction

from apps.notifications.models import KIND_PERMISSIONS, Notification, NotificationKind, wants_email


def notify(organization, *, kind, message, link="", warehouse=None, exclude_user=None):
    """Notifie les membres actifs ayant la permission du type (et l'accès au dépôt).

    Une notification interne par destinataire, et un email pour ceux qui l'ont
    choisi (adresse confirmée), envoyé une fois la transaction validée : une
    opération annulée ne doit rien annoncer.
    L'auteur de l'action est exclu : il sait déjà ce qu'il vient de faire.
    """
    from apps.accounts.models import Membership

    permission = KIND_PERMISSIONS[kind]
    memberships = Membership.objects.filter(
        organization=organization, is_active=True, user__is_active=True
    ).select_related("user")
    recipients = [
        m
        for m in memberships
        if m.has_perm(permission)
        and (warehouse is None or m.can_access_warehouse(warehouse))
        and (exclude_user is None or m.user_id != exclude_user.pk)
    ]
    message = message[:255]
    Notification.objects.bulk_create(
        Notification(
            organization=organization,
            recipient=m,
            kind=kind,
            message=message,
            link=link,
        )
        for m in recipients
    )

    emails = [m.user for m in recipients if m.user.email_verified_at and wants_email(m, kind)]
    if emails:
        from apps.accounts.emails import send_notification_emails

        transaction.on_commit(
            lambda: send_notification_emails(organization, kind, message, link, emails)
        )


def notify_stock_threshold(position, old_quantity, user=None):
    """Alerte au franchissement du seuil (pas à chaque vente sous le seuil)."""
    product = position.product
    new_quantity = position.quantity
    if new_quantity >= old_quantity:
        return
    if new_quantity == 0:
        kind = NotificationKind.STOCK_OUT
        message = f"Rupture : « {product.name} » est épuisé à {position.warehouse.name}."
    elif product.minimum_stock and old_quantity > product.minimum_stock >= new_quantity:
        kind = NotificationKind.STOCK_LOW
        message = (
            f"Stock faible : « {product.name} » à {position.warehouse.name} "
            f"({new_quantity} restant(s), seuil {product.minimum_stock})."
        )
    else:
        return
    # Destinataires : ceux qui peuvent réapprovisionner, y compris l'auteur de la vente.
    notify(
        position.organization,
        kind=kind,
        message=message,
        link="/stock/alertes",
        warehouse=position.warehouse,
    )
