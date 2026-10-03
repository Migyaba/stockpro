from django.db import transaction
from django.utils import timezone

from apps.core.exceptions import InvalidStateTransition, WarehouseForbidden
from apps.inventory.models import MovementType, Transfer, TransferStatus
from apps.inventory.services import apply_stock_delta
from apps.organizations.references import next_reference


@transaction.atomic
def complete_transfer(transfer: Transfer, user, membership):
    if transfer.status != TransferStatus.DRAFT:
        raise InvalidStateTransition("Seul un transfert brouillon peut être validé.")
    if transfer.source_id == transfer.destination_id:
        raise InvalidStateTransition("Les dépôts source et destination doivent être distincts.")
    if not membership.can_access_warehouse(transfer.source) or not membership.can_access_warehouse(
        transfer.destination
    ):
        raise WarehouseForbidden()

    items = list(transfer.items.select_related("product"))
    if not items:
        raise InvalidStateTransition("Le transfert n'a aucune ligne.")

    for item in items:
        apply_stock_delta(
            organization=transfer.organization,
            product=item.product,
            warehouse=transfer.source,
            delta=-item.quantity,
            movement_type=MovementType.TRANSFER_OUT,
            user=user,
            reference_type="transfer",
            reference_id=transfer.id,
        )
        apply_stock_delta(
            organization=transfer.organization,
            product=item.product,
            warehouse=transfer.destination,
            delta=item.quantity,
            movement_type=MovementType.TRANSFER_IN,
            user=user,
            reference_type="transfer",
            reference_id=transfer.id,
        )

    transfer.status = TransferStatus.COMPLETED
    transfer.completed_at = timezone.now()
    transfer.save(update_fields=["status", "completed_at", "updated_at"])
    return transfer


def assign_transfer_reference(transfer: Transfer):
    if not transfer.reference:
        transfer.reference = next_reference(transfer.organization, "TRANSFER")
        transfer.save(update_fields=["reference"])
    return transfer
