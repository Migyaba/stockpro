import json
import logging
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.organizations.billing import (
    PLAN_PRICING,
    activate_subscription_from_payment,
    create_subscription_checkout,
)
from apps.organizations.models import (
    OrganizationStatus,
    SubscriptionPayment,
    SubscriptionPlan,
)

logger = logging.getLogger(__name__)


class SubscriptionStatusView(APIView):
    """
    Retourne l'état actuel de l'abonnement et des paiements de l'organisation.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = request.organization
        now = timezone.now()

        end_date = org.subscription_ends_at or org.trial_ends_at
        days_remaining = max(0, (end_date - now).days) if end_date and end_date > now else 0

        # Vérification si l'organisation a un accès valide
        has_active_access = (
            org.status == OrganizationStatus.ACTIVE
            or (org.status == OrganizationStatus.TRIAL and org.trial_ends_at and org.trial_ends_at > now)
            or (org.subscription_ends_at and org.subscription_ends_at > now)
        )

        payments = SubscriptionPayment.objects.filter(organization=org).order_by("-created_at")[:5]
        payments_data = [
            {
                "id": str(p.id),
                "reference": p.reference,
                "plan": p.plan,
                "amount": p.amount,
                "currency": p.currency,
                "status": p.status,
                "created_at": p.created_at.isoformat(),
                "paid_at": p.paid_at.isoformat() if p.paid_at else None,
            }
            for p in payments
        ]

        return Response(
            {
                "organization_id": str(org.id),
                "organization_name": org.name,
                "status": org.status,
                "plan": org.subscription_plan,
                "has_active_access": has_active_access,
                "trial_ends_at": org.trial_ends_at.isoformat() if org.trial_ends_at else None,
                "subscription_ends_at": org.subscription_ends_at.isoformat() if org.subscription_ends_at else None,
                "days_remaining": days_remaining,
                "pricing": {
                    "monthly": {"amount": 5000, "period": "mois", "label": "Mensuel (5 000 F)"},
                    "quarterly": {"amount": 12500, "period": "trimestre", "label": "Trimestriel (12 500 F)"},
                },
                "recent_payments": payments_data,
            }
        )


class CheckoutSessionView(APIView):
    """
    Initialise une session de paiement Mobile Money via AlphaPay.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        org = request.organization
        plan = request.data.get("plan", "monthly").lower()
        phone = request.data.get("phone", "")
        return_url = request.data.get("return_url", "")

        mapped_plan = "QUARTERLY" if "quarter" in plan or "trimestre" in plan else "MONTHLY"

        try:
            checkout_data = create_subscription_checkout(
                organization=org,
                user=request.user,
                plan=mapped_plan,
                phone=phone,
                return_url=return_url,
            )
            return Response(checkout_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.exception("Échec d'initialisation du checkout AlphaPay: %s", e)
            return Response(
                {"error": {"code": "checkout_failed", "message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )


class AlphaPayWebhookView(APIView):
    """
    Point d'entrée du webhook AlphaPay (sécurisé par signature).
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        raw_body = request.body
        webhook_secret = getattr(settings, "ALPHAPAY_WEBHOOK_SECRET", None)

        if webhook_secret:
            try:
                from alphapay import AlphaPayWebhookSignatureError, verify_signature
                event = verify_signature(
                    payload=raw_body,
                    signature=request.headers.get("X-Webhook-Signature", ""),
                    timestamp=request.headers.get("X-Webhook-Timestamp", ""),
                    secret=webhook_secret,
                )
            except Exception as err:
                logger.warning("Signature webhook AlphaPay invalide : %s", err)
                return Response({"error": "Signature invalide"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            try:
                event = json.loads(raw_body.decode("utf-8"))
            except Exception:
                return Response({"error": "JSON invalide"}, status=status.HTTP_400_BAD_REQUEST)

        event_type = event.get("event")
        data = event.get("data", {})
        logger.info("Événement webhook AlphaPay reçu: %s", event_type)

        if event_type == "payment.succeeded":
            metadata = data.get("metadata", {})
            ref = metadata.get("order_id") or metadata.get("payment_ref") or data.get("order_id") or data.get("reference")

            payment = None
            if ref:
                payment = SubscriptionPayment.objects.filter(reference=ref).first()
            if not payment and data.get("id"):
                payment = SubscriptionPayment.objects.filter(alphapay_checkout_id=str(data.get("id"))).first()

            if payment:
                activate_subscription_from_payment(payment)
                return Response({"status": "ok", "message": f"Abonnement pour {ref} activé"}, status=status.HTTP_200_OK)
            else:
                logger.warning("Paiement introuvable pour la référence webhook : %s", ref)

        return Response({"status": "received", "event": event_type}, status=status.HTTP_200_OK)
