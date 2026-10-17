from apps.inventory.models import OPEN_INVENTORY_STATUSES, InventoryCount


def hidden_stock_warehouse_ids(membership):
    """Dépôts dont le stock est masqué à ce membre : ceux où un inventaire est
    ouvert, pour qui ne valide pas les inventaires (caissier par défaut).

    Sans cela, le comptage « à l'aveugle » ne l'est pas : il suffirait de lire
    la quantité sur la page Stock et de la recopier.
    """
    if membership is None or membership.has_perm("inventory.validate"):
        return set()
    return set(
        InventoryCount.objects.filter(
            organization_id=membership.organization_id, status__in=OPEN_INVENTORY_STATUSES
        ).values_list("warehouse_id", flat=True)
    )
