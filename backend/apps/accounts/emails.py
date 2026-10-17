import logging
import threading

from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
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


def _render(context):
    """Rend l'email (texte + HTML) à partir du gabarit commun emails/action."""
    site_url = settings.FRONTEND_URL.rstrip("/")
    context = {
        "site_url": site_url,
        "logo_url": f"{site_url}/email/logo.png",
        "paragraphs": [],
        "note": "",
        "footer_note": "Vous recevez cet email suite à une action sur STOCKPRO.",
        **context,
    }
    return (
        render_to_string("emails/action.txt", context).strip() + "\n",
        render_to_string("emails/action.html", context),
    )


def send_in_background(subject, context, recipient):
    """Envoi hors de la requête : la durée de l'envoi SMTP ne doit pas révéler
    si un compte existe, ni bloquer l'utilisateur. Synchrone en test
    (AUTH_EMAIL_ASYNC)."""
    text, html = _render(context)

    def send():
        try:
            message = EmailMultiAlternatives(subject=subject, body=text, to=[recipient])
            message.attach_alternative(html, "text/html")
            message.send()
        except Exception:
            logger.exception("Échec d'envoi de l'email « %s ».", subject)

    if settings.AUTH_EMAIL_ASYNC:
        threading.Thread(target=send, daemon=True).start()
    else:
        send()


def _greeting(user):
    return f"Bonjour {user.first_name}," if user.first_name else "Bonjour,"


def _link_validity_days():
    return max(1, settings.PASSWORD_RESET_TIMEOUT // 86400)


def send_verification_email(user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = email_verification_token.make_token(user)
    link = f"{settings.FRONTEND_URL.rstrip('/')}/verify-email?uid={uid}&token={token}"
    send_in_background(
        "Activez votre compte STOCKPRO",
        {
            "title": "Confirmez votre adresse email",
            "preheader": "Un clic pour activer votre compte et démarrer votre essai gratuit.",
            "greeting": _greeting(user),
            "paragraphs": [
                "Merci d'avoir créé votre espace STOCKPRO. Confirmez votre adresse email pour activer "
                "votre compte : votre essai gratuit de 7 jours démarre à ce moment-là.",
            ],
            "button_label": "Activer mon compte",
            "button_url": link,
            "note": f"Ce lien est valable {_link_validity_days()} jours et ne sert qu'une fois.",
            "footer_note": "Vous n'avez pas créé de compte STOCKPRO ? Ignorez cet email.",
        },
        user.email,
    )


def send_password_reset_email(user, link):
    send_in_background(
        "Réinitialisez votre mot de passe STOCKPRO",
        {
            "title": "Nouveau mot de passe",
            "preheader": "Choisissez un nouveau mot de passe pour votre compte STOCKPRO.",
            "greeting": _greeting(user),
            "paragraphs": [
                "Vous avez demandé à réinitialiser le mot de passe de votre compte STOCKPRO. "
                "Cliquez sur le bouton ci-dessous pour en choisir un nouveau.",
            ],
            "button_label": "Choisir un nouveau mot de passe",
            "button_url": link,
            "note": (
                f"Ce lien est valable {_link_validity_days()} jours et ne sert qu'une fois. "
                "Une fois le mot de passe changé, vos autres sessions sont déconnectées."
            ),
            "footer_note": "Vous n'êtes pas à l'origine de cette demande ? Ignorez cet email : rien ne change.",
        },
        user.email,
    )


def send_invitation_email(invitation, inviter, link):
    organization = invitation.organization.name
    send_in_background(
        f"Invitation à rejoindre {organization} sur STOCKPRO",
        {
            "title": f"Rejoignez {organization}",
            "preheader": f"{inviter.full_name or inviter.email} vous invite sur STOCKPRO.",
            "greeting": "Bonjour,",
            "paragraphs": [
                f"{inviter.full_name or inviter.email} vous invite à rejoindre « {organization} » sur "
                "STOCKPRO, l'outil de gestion de stock et de boutiques de l'équipe.",
            ],
            "button_label": "Accepter l'invitation",
            "button_url": link,
            "note": "Cette invitation est valable 7 jours.",
            "footer_note": "Vous ne connaissez pas cette organisation ? Ignorez cet email.",
        },
        invitation.email,
    )
