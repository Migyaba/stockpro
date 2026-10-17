import logging
import threading

from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

logger = logging.getLogger(__name__)


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    """Lien de confirmation d'email : usage unique (dépend de email_verified_at)
    et même durée de validité que la réinitialisation (PASSWORD_RESET_TIMEOUT)."""

    key_salt = "apps.accounts.emails.EmailVerificationTokenGenerator"

    def _make_hash_value(self, user, timestamp):
        return f"{user.pk}{user.email}{user.email_verified_at}{timestamp}"


email_verification_token = EmailVerificationTokenGenerator()


def send_in_background(subject, message, recipient):
    """Envoi hors de la requête : la durée de l'envoi SMTP ne doit pas révéler
    si un compte existe. Synchrone en test (AUTH_EMAIL_ASYNC)."""

    def send():
        try:
            send_mail(subject=subject, message=message, from_email=None, recipient_list=[recipient])
        except Exception:
            logger.exception("Échec d'envoi de l'email « %s ».", subject)

    if settings.AUTH_EMAIL_ASYNC:
        threading.Thread(target=send, daemon=True).start()
    else:
        send()


def send_verification_email(user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = email_verification_token.make_token(user)
    link = f"{settings.FRONTEND_URL.rstrip('/')}/verify-email?uid={uid}&token={token}"
    send_in_background(
        "STOCKPRO — Confirmez votre adresse email",
        (
            f"Bonjour {user.first_name},\n\n"
            "Pour activer votre compte et démarrer votre essai gratuit, ouvrez ce lien :\n"
            f"{link}\n\n"
            "Si vous n'avez pas créé de compte STOCKPRO, ignorez ce message."
        ),
        user.email,
    )


def send_password_reset_email(user, link):
    send_in_background(
        "STOCKPRO — Réinitialisation de votre mot de passe",
        (
            f"Bonjour {user.first_name},\n\n"
            "Pour choisir un nouveau mot de passe, ouvrez ce lien :\n"
            f"{link}\n\n"
            "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message."
        ),
        user.email,
    )
