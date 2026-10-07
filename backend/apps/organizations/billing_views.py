import json
import logging
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .billing import (
    activate_subscription_from_payment,
    create_subscription_checkout,
    get_organization_plan_pricing,
    verify_subscription_payment,
)
from .models import (
    OrganizationStatus,
    PaymentStatus,
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

        # Si le paiement le plus récent est en attente, interroger AlphaPay en direct
        # (au plus une fois toutes les 15 s par paiement pour ne pas saturer l'API).
        latest_pending = (
            SubscriptionPayment.objects.filter(organization=org, status=PaymentStatus.PENDING)
            .order_by("-created_at")
            .first()
        )
        if latest_pending and cache.add(f"alphapay-verify:{latest_pending.pk}", 1, 15):
            verify_subscription_payment(latest_pending)
            org.refresh_from_db()

        # Les droits d'accès sont évalués à chaque requête (HasPermission); ici on
        # synchronise seulement le statut stocké pour l'affichage et l'admin.
        if (
            org.status in (OrganizationStatus.ACTIVE, OrganizationStatus.TRIAL)
            and not org.has_operational_access(now)
        ):
            org.status = OrganizationStatus.SUSPENDED
            org.save(update_fields=["status"])

        has_active_access = org.has_operational_access(now)
        if org.status == OrganizationStatus.TRIAL:
            end_date = org.trial_ends_at
        else:
            end_date = org.subscription_ends_at
        days_remaining = max(0, (end_date - now).days) if end_date and end_date > now else 0

        pricing_map = get_organization_plan_pricing(org)
        monthly_cfg = pricing_map[SubscriptionPlan.MONTHLY]
        quarterly_cfg = pricing_map[SubscriptionPlan.QUARTERLY]

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
                "has_custom_pricing": org.has_custom_pricing,
                "trial_ends_at": org.trial_ends_at.isoformat() if org.trial_ends_at else None,
                "subscription_ends_at": org.subscription_ends_at.isoformat() if org.subscription_ends_at else None,
                "days_remaining": days_remaining,
                "pricing": {
                    "monthly": {
                        "amount": monthly_cfg["amount"],
                        "period": "mois",
                        "label": f"Mensuel ({monthly_cfg['amount']:,} F)".replace(",", " "),
                        "is_custom": monthly_cfg["is_custom"],
                    },
                    "quarterly": {
                        "amount": quarterly_cfg["amount"],
                        "period": "trimestre",
                        "label": f"Trimestriel ({quarterly_cfg['amount']:,} F)".replace(",", " "),
                        "is_custom": quarterly_cfg["is_custom"],
                    },
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
            message = str(e) if isinstance(e, ValueError) else (
                "Impossible d'initialiser le paiement. Veuillez réessayer."
            )
            return Response(
                {"error": {"code": "checkout_failed", "message": message}},
                status=status.HTTP_400_BAD_REQUEST,
            )


class VerifyPaymentView(APIView):
    """
    Interroge l'API AlphaPay pour vérifier et valider immédiatement un paiement en attente.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        org = request.organization
        ref = request.data.get("reference")

        query = SubscriptionPayment.objects.filter(organization=org)
        if ref:
            payment = query.filter(reference=ref).first()
        else:
            payment = query.filter(status=PaymentStatus.PENDING).order_by("-created_at").first()

        if not payment:
            return Response(
                {"error": {"code": "not_found", "message": "Aucun paiement trouvé à vérifier."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        updated_payment = verify_subscription_payment(payment)
        org.refresh_from_db()

        is_completed = updated_payment.status == PaymentStatus.COMPLETED
        return Response({
            "reference": updated_payment.reference,
            "status": updated_payment.status,
            "is_completed": is_completed,
            "plan": updated_payment.plan,
            "amount": updated_payment.amount,
            "subscription_ends_at": org.subscription_ends_at.isoformat() if org.subscription_ends_at else None,
            "message": "Paiement validé avec succès ! Votre abonnement est actif."
            if is_completed
            else "Le paiement est toujours en cours de confirmation auprès de l'opérateur.",
        })


class AlphaPayWebhookView(APIView):
    """
    Point d'entrée du webhook AlphaPay (sécurisé par signature).
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        raw_body = request.body
        webhook_secret = getattr(settings, "ALPHAPAY_WEBHOOK_SECRET", None)

        if not webhook_secret and not settings.DEBUG:
            logger.error("Webhook AlphaPay refusé : ALPHAPAY_WEBHOOK_SECRET non configuré.")
            return Response({"error": "Webhook non configuré"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        if webhook_secret:
            try:
                from alphapay import AlphaPayWebhookSignatureError, verify_signature  # type: ignore
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
        logger.info("Événement webhook AlphaPay reçu : %s", event_type)

        if event_type in ["payment.succeeded", "checkout_session.paid", "checkout_session.completed", "checkout.paid"]:
            metadata = data.get("metadata", {})
            ref = (
                metadata.get("order_id")
                or metadata.get("payment_ref")
                or metadata.get("reference")
                or data.get("order_id")
                or data.get("reference")
            )

            payment = None
            if ref:
                payment = SubscriptionPayment.objects.filter(reference=ref).first()
            if not payment and data.get("id"):
                payment = SubscriptionPayment.objects.filter(alphapay_checkout_id=str(data.get("id"))).first()
            if not payment and data.get("checkout_session_id"):
                payment = SubscriptionPayment.objects.filter(alphapay_checkout_id=str(data.get("checkout_session_id"))).first()
            if not payment and data.get("slug"):
                payment = SubscriptionPayment.objects.filter(alphapay_slug=str(data.get("slug"))).first()

            if payment:
                activate_subscription_from_payment(payment)
                return Response({"status": "ok", "message": f"Abonnement pour {payment.reference} activé"}, status=status.HTTP_200_OK)
            else:
                logger.warning("Paiement introuvable pour la référence webhook : %s (id: %s)", ref, data.get("id"))

        return Response({"status": "received", "event": event_type}, status=status.HTTP_200_OK)
