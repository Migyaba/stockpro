import logging
import uuid
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from apps.organizations.models import (
    Organization,
    OrganizationStatus,
    PaymentStatus,
    SubscriptionPayment,
    SubscriptionPlan,
)

logger = logging.getLogger(__name__)

PLAN_PRICING = {
    SubscriptionPlan.MONTHLY: {"amount": 5000, "days": 30, "label": "Abonnement Mensuel"},
    SubscriptionPlan.QUARTERLY: {"amount": 12500, "days": 90, "label": "Abonnement Trimestriel"},
}


def get_alphapay_client():
    secret_key = getattr(settings, "ALPHAPAY_SECRET_KEY", None)
    if not secret_key:
        return None
    try:
        from alphapay import AlphaPayClient
        return AlphaPayClient(secret_key)
    except ImportError:
        logger.error("Le package 'alphapay' n'est pas installé.")
        return None


def create_subscription_checkout(organization: Organization, user, plan: str, phone: str = "", return_url: str = ""):
    """
    Initialise une session de paiement AlphaPay pour un abonnement StockPro.
    """
    plan_upper = plan.upper()
    if plan_upper not in PLAN_PRICING:
        raise ValueError(f"Plan invalide: {plan}. Utilisez 'MONTHLY' ou 'QUARTERLY'.")

    cfg = PLAN_PRICING[plan_upper]
    amount = cfg["amount"]
    ref = f"SUB-{uuid.uuid4().hex[:10].upper()}"

    customer_phone = phone or user.phone or organization.phone or ""
    customer_email = user.email or organization.email or ""
    customer_name = user.get_full_name() or organization.name or "Client StockPro"

    if not return_url:
        frontend_url = getattr(settings, "FRONTEND_URL", "https://stockpro.miguelmissetcho.com").rstrip("/")
        return_url = f"{frontend_url}/parametres?payment=success&ref={ref}"

    payment = SubscriptionPayment.objects.create(
        organization=organization,
        reference=ref,
        plan=plan_upper,
        amount=amount,
        currency="XOF",
        customer_phone=customer_phone,
        customer_email=customer_email,
        status=PaymentStatus.PENDING,
        metadata={
            "user_id": str(user.id),
            "organization_id": str(organization.id),
            "plan": plan_upper,
        },
    )

    client = get_alphapay_client()
    if client:
        try:
            session = client.checkout_sessions.create(
                amount=amount,
                currency="XOF",
                description=f"StockPro - {cfg['label']} ({organization.name})",
                customer_email=customer_email,
                customer_name=customer_name,
                customer_phone=customer_phone if customer_phone.startswith("+") else f"+229{customer_phone}",
                return_url=return_url,
                metadata={
                    "order_id": ref,
                    "organization_id": str(organization.id),
                    "plan": plan_upper,
                },
                idempotency_key=True,
            )

            payment.alphapay_checkout_id = str(session.get("id", ""))
            payment.alphapay_slug = str(session.get("slug", ""))
            payment.save(update_fields=["alphapay_checkout_id", "alphapay_slug"])

            return {
                "checkout_url": session.get("checkout_url"),
                "reference": ref,
                "amount": amount,
                "plan": plan_upper,
                "is_sandbox": getattr(settings, "ALPHAPAY_SECRET_KEY", "").startswith("sk_test_"),
            }
        except Exception as e:
            logger.exception("Erreur lors de l'appel AlphaPay checkout_sessions.create: %s", e)
            raise

    # Si pas de clé AlphaPay configurée (mode simulation / dev)
    return {
        "checkout_url": f"{return_url}&mock_checkout=1",
        "reference": ref,
        "amount": amount,
        "plan": plan_upper,
        "is_sandbox": True,
        "note": "Mode simulation (ALPHAPAY_SECRET_KEY non configurée).",
    }


def activate_subscription_from_payment(payment: SubscriptionPayment):
    """
    Active ou prolonge l'abonnement de l'organisation suite à un paiement réussi.
    """
    if payment.status == PaymentStatus.COMPLETED:
        return payment

    now = timezone.now()
    org = payment.organization
    current_end = org.subscription_ends_at

    # Si l'organisation avait encore du temps, on ajoute les jours à la fin existante
    base_date = current_end if current_end and current_end > now else now

    days = PLAN_PRICING.get(payment.plan, {}).get("days", 30)
    new_end_date = base_date + timedelta(days=days)

    org.subscription_plan = payment.plan
    org.subscription_ends_at = new_end_date
    org.status = OrganizationStatus.ACTIVE
    org.save(update_fields=["subscription_plan", "subscription_ends_at", "status"])

    payment.status = PaymentStatus.COMPLETED
    payment.paid_at = now
    payment.save(update_fields=["status", "paid_at"])

    logger.info(
        "Abonnement activé pour l'organisation '%s' (Plan: %s, Jusqu'au: %s)",
        org.name,
        payment.plan,
        new_end_date.strftime("%Y-%m-%d %H:%M"),
    )
    return payment
