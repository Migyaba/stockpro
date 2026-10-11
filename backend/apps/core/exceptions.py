import logging

from django.core.exceptions import ObjectDoesNotExist
from django.db import IntegrityError
from rest_framework.exceptions import APIException, NotFound, ValidationError
from rest_framework.settings import api_settings
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


class Conflict(APIException):
    status_code = 409
    default_detail = "Cette opération entre en conflit avec des données existantes."
    default_code = "CONFLICT"


class BusinessError(APIException):
    status_code = 400
    default_detail = "Opération impossible."
    default_code = "business_error"

    def __init__(self, detail, code="business_error", extra=None):
        super().__init__(detail=detail, code=code)
        self.extra = extra or {}


class InsufficientStock(BusinessError):
    default_code = "STOCK_INSUFFICIENT"

    def __init__(self, product_name, requested, available, warehouse_name):
        super().__init__(
            detail=(
                f"Impossible de valider cette opération.\n\n"
                f"Stock insuffisant pour :\n"
                f"{product_name}\n"
                f"Demandé : {requested}\n"
                f"Disponible : {available}\n"
                f"Dépôt : {warehouse_name}"
            ),
            code="STOCK_INSUFFICIENT",
            extra={
                "product": product_name,
                "requested": requested,
                "available": available,
                "warehouse": warehouse_name,
            },
        )


class InvalidStateTransition(BusinessError):
    def __init__(self, detail="Cette transition n'est pas autorisée."):
        super().__init__(detail=detail, code="INVALID_STATE_TRANSITION")


class WarehouseForbidden(BusinessError):
    status_code = 403

    def __init__(self, detail="Vous n'avez pas accès à ce dépôt."):
        super().__init__(detail=detail, code="WAREHOUSE_FORBIDDEN")


class IdempotencyConflict(BusinessError):
    status_code = 409

    def __init__(self):
        super().__init__(
            detail="Cette clé d'idempotence a déjà été utilisée avec un autre contenu.",
            code="IDEMPOTENCY_CONFLICT",
        )


class IdempotencyInProgress(BusinessError):
    status_code = 409

    def __init__(self):
        super().__init__(
            detail="Une requête avec cette clé d'idempotence est déjà en cours de traitement.",
            code="IDEMPOTENCY_IN_PROGRESS",
        )


def api_exception_handler(exc, context):
    if isinstance(exc, IntegrityError):
        # Contrainte d'unicité/intégrité non anticipée par la validation : 409 plutôt qu'une 500.
        logger.warning("IntegrityError convertie en 409 : %s", exc)
        exc = Conflict()
    elif isinstance(exc, ObjectDoesNotExist):
        exc = NotFound()

    response = exception_handler(exc, context)
    if response is None:
        return response

    code = getattr(exc, "default_code", None) or "error"
    if isinstance(exc, BusinessError):
        codes = exc.get_codes()
        if isinstance(codes, str):
            code = codes
    payload = {"error": {"code": code, "message": _message(response.data)}}
    if isinstance(exc, ValidationError) and isinstance(response.data, dict):
        # Détail par champ pour les formulaires (ex. {"sku": ["…"]}).
        payload["error"]["fields"] = response.data
    extra = getattr(exc, "extra", None)
    if extra:
        payload["error"]["details"] = extra
    response.data = payload
    return response


def _message(data):
    """Message lisible : « Identifiants incorrects. », « sku : Un produit actif… »."""
    if isinstance(data, dict):
        if "detail" in data:
            return str(data["detail"])
        parts = []
        for key, value in data.items():
            text = _message(value)
            if not text:
                continue
            parts.append(text if key == api_settings.NON_FIELD_ERRORS_KEY else f"{key} : {text}")
        return " ".join(parts)
    if isinstance(data, list):
        return " ".join(text for text in (_message(item) for item in data) if text)
    return str(data)
