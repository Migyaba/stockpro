import ipaddress

from rest_framework.throttling import BaseThrottle

from apps.audit.models import AuditAction, AuditLog


def _client_ip(request):
    # Même logique que le throttling (NUM_PROXIES) : le client ne peut pas usurper son IP.
    ident = BaseThrottle().get_ident(request)
    try:
        return str(ipaddress.ip_address(ident))
    except ValueError:
        return None


def write_audit(request, *, action, entity, extra=None):
    org = getattr(request, "organization", None)
    if org is None:
        return
    ip = _client_ip(request)
    AuditLog.objects.create(
        organization=org,
        user=getattr(request, "user", None) if getattr(request.user, "is_authenticated", False) else None,
        action=action,
        entity_type=entity.__class__.__name__,
        entity_id=str(entity.pk),
        new_values=extra,
        ip_address=ip,
        user_agent=(request.META.get("HTTP_USER_AGENT") or "")[:255],
    )


__all__ = ["write_audit", "AuditAction"]
