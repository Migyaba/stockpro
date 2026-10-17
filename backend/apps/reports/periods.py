from datetime import date, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.utils import timezone

from apps.core.exceptions import BusinessError

MAX_PERIOD_DAYS = 732


def organization_today(org) -> date:
    try:
        tz = ZoneInfo(org.timezone)
    except (ZoneInfoNotFoundError, ValueError):
        tz = None
    return timezone.localdate(timezone=tz)


def validate_document_date(value, org):
    """Date d'une vente ou d'un achat : ni dans le futur, ni plus ancienne que
    le délai de saisie rétroactive de l'organisation."""
    from rest_framework import serializers

    today = organization_today(org)
    if value > today:
        raise serializers.ValidationError("La date ne peut pas être dans le futur.")
    oldest = today - timedelta(days=org.backdating_days)
    if value < oldest:
        raise serializers.ValidationError(
            f"La date ne peut pas être antérieure au {oldest.strftime('%d/%m/%Y')} "
            f"({org.backdating_days} jours de saisie rétroactive autorisés)."
        )
    return value


def _parse(value, name):
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError) as exc:
        raise BusinessError(f"{name} doit être une date AAAA-MM-JJ.", code="INVALID_PERIOD") from exc


def parse_period(params, org, default_days=30):
    """Période [date_from, date_to] inclusive ; par défaut les `default_days` derniers jours."""
    date_to = _parse(params["date_to"], "date_to") if params.get("date_to") else organization_today(org)
    if params.get("date_from"):
        date_from = _parse(params["date_from"], "date_from")
    else:
        date_from = date_to - timedelta(days=default_days - 1)
    if date_from > date_to:
        raise BusinessError("La date de début doit précéder la date de fin.", code="INVALID_PERIOD")
    if (date_to - date_from).days > MAX_PERIOD_DAYS:
        raise BusinessError("Période limitée à deux ans.", code="INVALID_PERIOD")
    return date_from, date_to


def previous_period(date_from, date_to):
    """Période de même durée juste avant, pour calculer l'évolution."""
    length = (date_to - date_from).days + 1
    prev_to = date_from - timedelta(days=1)
    return prev_to - timedelta(days=length - 1), prev_to
