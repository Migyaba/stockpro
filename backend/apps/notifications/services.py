from apps.notifications.models import Notification, NotificationKind


def notify(organization, *, permission, kind, message, link="", warehouse=None, exclude_user=None):
    """Notifie les membres actifs ayant `permission` (et l'accès au dépôt concerné).

    L'auteur de l'action est exclu : il sait déjà ce qu'il vient de faire.
    """
    from apps.accounts.models import Membership

    memberships = Membership.objects.filter(organization=organization, is_active=True)
    recipients = [
        m
        for m in memberships
        if m.has_perm(permission)
        and (warehouse is None or m.can_access_warehouse(warehouse))
        and (exclude_user is None or m.user_id != exclude_user.pk)
    ]
    Notification.objects.bulk_create(
        Notification(
            organization=organization,
            recipient=m,
            kind=kind,
            message=message[:255],
            link=link,
        )
        for m in recipients
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
        permission="purchases.create",
        kind=kind,
        message=message,
        link="/stock/alertes",
        warehouse=position.warehouse,
    )
