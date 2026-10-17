import uuid

from rest_framework.exceptions import ValidationError


def uuid_param(request, name):
    """Paramètre de requête attendu comme UUID : absent → None, mal formé → 400.

    Sans ce contrôle, un identifiant invalide passé à un filtre fait lever une
    ValidationError Django non gérée, donc une erreur 500.
    """
    value = request.query_params.get(name)
    if not value:
        return None
    try:
        return uuid.UUID(value)
    except ValueError as exc:
        raise ValidationError({name: "Identifiant invalide."}) from exc
