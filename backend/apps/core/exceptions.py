from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler


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


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response

    extra = getattr(exc, "extra", None)
    payload = {
        "error": {
            "code": getattr(exc, "default_code", None)
            or getattr(getattr(exc, "detail", None), "code", None)
            or "error",
            "message": _message(response.data),
        }
    }
    if extra:
        payload["error"]["details"] = extra
    if isinstance(exc, BusinessError):
        payload["error"]["code"] = exc.default_code if exc.default_code != "business_error" else (
            getattr(exc, "get_codes", lambda: "business_error")()
            if not isinstance(getattr(exc, "detail", None), str)
            else (exc.get_codes() if hasattr(exc, "get_codes") else "business_error")
        )
        codes = exc.get_codes() if hasattr(exc, "get_codes") else None
        if isinstance(codes, str):
            payload["error"]["code"] = codes
    response.data = payload
    return response


def _message(data):
    if isinstance(data, dict):
        if "detail" in data:
            return str(data["detail"])
        parts = []
        for key, value in data.items():
            parts.append(f"{key}: {value}")
        return " ".join(parts)
    if isinstance(data, list):
        return " ".join(str(item) for item in data)
    return str(data)
