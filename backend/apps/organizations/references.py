from django.db import transaction

from apps.organizations.models import DocumentSequence

PREFIXES = {
    "SALE": "V",
    "PURCHASE": "A",
    "TRANSFER": "TR",
    "RECEIPT": "RE",
}


def next_reference(organization, kind: str) -> str:
    prefix = PREFIXES[kind]
    with transaction.atomic():
        seq, _ = DocumentSequence.objects.select_for_update().get_or_create(
            organization=organization, kind=kind, defaults={"last_value": 0}
        )
        seq.last_value += 1
        seq.save(update_fields=["last_value"])
        return f"{prefix}-{seq.last_value:06d}"
