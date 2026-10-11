import functools
import hashlib
import json
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework.response import Response

from apps.core.exceptions import BusinessError, IdempotencyConflict, IdempotencyInProgress
from apps.core.models import IdempotencyRecord

IDEMPOTENCY_TTL = timedelta(hours=24)


def _fingerprint(request):
    payload = json.dumps(request.data, sort_keys=True, default=str)
    raw = f"{request.method}:{request.path}:{payload}"
    return hashlib.sha256(raw.encode()).hexdigest()


def idempotent(view_method):
    """Rejoue la réponse d'une validation déjà traitée avec le même Idempotency-Key.

    - même clé + même contenu → même réponse, sans nouveau mouvement de stock ;
    - même clé + contenu différent → IDEMPOTENCY_CONFLICT ;
    - seules les réponses 2xx sont mémorisées, une erreur libère la clé.
    """

    @functools.wraps(view_method)
    def wrapper(self, request, *args, **kwargs):
        key = (request.headers.get("Idempotency-Key") or "").strip()
        if not key:
            return view_method(self, request, *args, **kwargs)
        if len(key) > 128:
            raise BusinessError("Idempotency-Key trop long (128 caractères max).", code="IDEMPOTENCY_KEY_INVALID")

        organization = request.organization
        fingerprint = _fingerprint(request)
        with transaction.atomic():
            IdempotencyRecord.objects.filter(
                organization=organization,
                key=key,
                created_at__lt=timezone.now() - IDEMPOTENCY_TTL,
            ).delete()
            record, created = IdempotencyRecord.objects.get_or_create(
                organization=organization, key=key, defaults={"fingerprint": fingerprint}
            )

        if not created:
            if record.fingerprint != fingerprint:
                raise IdempotencyConflict()
            if record.response_status is None:
                raise IdempotencyInProgress()
            return Response(record.response_body, status=record.response_status)

        try:
            response = view_method(self, request, *args, **kwargs)
        except Exception:
            record.delete()
            raise
        if 200 <= response.status_code < 300:
            record.response_status = response.status_code
            record.response_body = response.data
            record.save(update_fields=["response_status", "response_body", "updated_at"])
        else:
            record.delete()
        return response

    return wrapper
