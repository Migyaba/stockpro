from apps.audit.models import AuditAction, AuditLog


def write_audit(request, *, action, entity, extra=None):
    org = getattr(request, "organization", None)
    if org is None:
        return
    ip = None
    if request.META.get("HTTP_X_FORWARDED_FOR"):
        ip = request.META["HTTP_X_FORWARDED_FOR"].split(",")[0].strip()
    else:
        ip = request.META.get("REMOTE_ADDR")
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
