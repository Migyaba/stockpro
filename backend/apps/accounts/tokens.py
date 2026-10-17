import time

from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken


def password_fingerprint(user):
    """Empreinte du mot de passe courant (HMAC de Django, tronqué).

    Elle change avec le mot de passe : tout jeton émis avant un changement ou
    une réinitialisation est refusé (TenantJWTAuthentication, RefreshView).
    """
    return user.get_session_auth_hash()[:16]


def session_expired(auth_time):
    """La session a-t-elle dépassé sa durée maximale depuis la connexion ?"""
    max_age = settings.SIMPLE_JWT["SESSION_MAX_LIFETIME"].total_seconds()
    return auth_time is None or time.time() - auth_time > max_age


def issue_tokens(user, membership, auth_time=None):
    """Émet un couple de jetons.

    ``auth_time`` est l'heure de la connexion d'origine : la rotation du refresh
    la conserve, ce qui borne la durée totale de la session.
    """
    claims = {
        "membership_id": str(membership.id),
        "organization_id": str(membership.organization_id),
        "role": membership.role,
        "pwd": password_fingerprint(user),
        "auth_time": int(auth_time if auth_time is not None else time.time()),
    }
    refresh = RefreshToken.for_user(user)
    for key, value in claims.items():
        refresh[key] = value
    access = refresh.access_token
    for key, value in claims.items():
        access[key] = value
    return {
        "access": str(access),
        "refresh": str(refresh),
    }
