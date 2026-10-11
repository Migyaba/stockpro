import ipaddress
from decimal import Decimal

from django.db import models
from rest_framework.throttling import BaseThrottle

from apps.audit.models import AuditAction, AuditLog

# Jamais journalisés (§45 : informations sensibles protégées).
SENSITIVE_FIELDS = {"password", "token", "token_hash", "secret", "logo", "image"}


def _client_ip(request):
    # Même logique que le throttling (NUM_PROXIES) : le client ne peut pas usurper son IP.
    ident = BaseThrottle().get_ident(request)
    try:
        return str(ipaddress.ip_address(ident))
    except ValueError:
        return None


def entity_label(entity) -> str:
    user = getattr(entity, "user", None)  # membership : la personne concernée
    if user is not None and getattr(user, "email", None):
        return (user.full_name or user.email)[:255]
    for attr in ("reference", "name", "email"):
        value = getattr(entity, attr, None)
        if value:
            return str(value)[:255]
    return str(entity)[:255]


def _plain(value):
    """Valeur sérialisable en JSON (FK → identifiant, UUID/Decimal → texte)."""
    if isinstance(value, models.Model):
        return str(value.pk)
    if isinstance(value, (bool, int, float, str)) or value is None:
        return value
    if isinstance(value, Decimal):
        return str(value)
    return str(value)


def snapshot(instance, fields):
    """Valeurs des champs concrets du modèle (ni méthodes, ni champs calculés)."""
    model_fields = {f.name for f in instance._meta.concrete_fields}
    return {
        f: _plain(getattr(instance, f, None))
        for f in fields
        if f in model_fields and f not in SENSITIVE_FIELDS
    }


def diff(before: dict, after: dict):
    """Ne garde que les champs réellement modifiés (données inutiles non stockées)."""
    changed = [k for k in after if before.get(k) != after.get(k)]
    return {k: before.get(k) for k in changed}, {k: after.get(k) for k in changed}


def write_audit(request, *, action, entity, extra=None, old_values=None, label=None):
    org = getattr(request, "organization", None)
    if org is None:
        return
    user = getattr(request, "user", None)
    AuditLog.objects.create(
        organization=org,
        user=user if getattr(user, "is_authenticated", False) else None,
        action=action,
        entity_type=entity.__class__.__name__,
        entity_id=str(entity.pk),
        entity_label=label or entity_label(entity),
        old_values=old_values,
        new_values=extra,
        ip_address=_client_ip(request),
        user_agent=(request.META.get("HTTP_USER_AGENT") or "")[:255],
    )


__all__ = ["write_audit", "AuditAction", "snapshot", "diff"]
