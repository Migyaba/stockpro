from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from apps.core.models import TimeStampedModel

CURRENCY_EXPONENTS = {
    "XOF": 0,
    "XAF": 0,
    "GNF": 0,
    "CDF": 0,
    "MGA": 0,
    "EUR": 2,
    "USD": 2,
}


class OrganizationStatus(models.TextChoices):
    ACTIVE = "ACTIVE"
    TRIAL = "TRIAL"
    SUSPENDED = "SUSPENDED"
    CANCELLED = "CANCELLED"


class SubscriptionPlan(models.TextChoices):
    TRIAL = "TRIAL", "Essai Gratuit 7j"
    MONTHLY = "MONTHLY", "Mensuel (5 000 F)"
    QUARTERLY = "QUARTERLY", "Trimestriel (12 500 F)"
    CUSTOM = "CUSTOM", "Déploiement Sur-Mesure"


class PaymentStatus(models.TextChoices):
    PENDING = "PENDING", "En attente"
    COMPLETED = "COMPLETED", "Payé"
    FAILED = "FAILED", "Échoué"
    CANCELLED = "CANCELLED", "Annulé"


class Organization(TimeStampedModel):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    logo = models.ImageField(upload_to="logos/", blank=True, null=True)
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=32, blank=True)
    email = models.EmailField(blank=True)
    country = models.CharField(max_length=2, default="BJ")
    currency = models.CharField(max_length=3, default="XOF")
    currency_exponent = models.PositiveSmallIntegerField(default=0)
    timezone = models.CharField(max_length=64, default="Africa/Porto-Novo")
    language = models.CharField(max_length=8, default="fr")
    date_format = models.CharField(max_length=32, default="DD/MM/YYYY")
    tax_enabled = models.BooleanField(default=False)
    tax_rate_bps = models.PositiveIntegerField(default=0, help_text="Taux en points de base. 1800 = 18%.")
    prices_include_tax = models.BooleanField(default=True)
    max_discount_percent_manager = models.PositiveSmallIntegerField(default=10)
    status = models.CharField(
        max_length=20, choices=OrganizationStatus.choices, default=OrganizationStatus.SUSPENDED
    )
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    subscription_plan = models.CharField(
        max_length=20,
        choices=SubscriptionPlan.choices,
        default=SubscriptionPlan.MONTHLY,
    )
    subscription_ends_at = models.DateTimeField(null=True, blank=True)
    custom_monthly_price = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Tarif mensuel personnalisé (FCFA). Laissez vide pour utiliser le tarif global de la plateforme.",
    )
    custom_quarterly_price = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Tarif trimestriel personnalisé (FCFA). Laissez vide pour utiliser le tarif global de la plateforme.",
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def get_effective_monthly_price(self) -> int:
        if self.custom_monthly_price is not None and self.custom_monthly_price > 0:
            return self.custom_monthly_price
        return PlatformSubscriptionConfig.get_config().default_monthly_price

    def get_effective_quarterly_price(self) -> int:
        if self.custom_quarterly_price is not None and self.custom_quarterly_price > 0:
            return self.custom_quarterly_price
        return PlatformSubscriptionConfig.get_config().default_quarterly_price

    @property
    def has_custom_pricing(self) -> bool:
        return (
            (self.custom_monthly_price is not None and self.custom_monthly_price > 0)
            or (self.custom_quarterly_price is not None and self.custom_quarterly_price > 0)
        )

    def has_operational_access(self, now=None) -> bool:
        """Accès autorisé: abonnement payé en cours, ou essai gratuit non expiré."""
        now = now or timezone.now()
        if self.status == OrganizationStatus.ACTIVE:
            return self.subscription_ends_at is None or self.subscription_ends_at > now
        if self.status == OrganizationStatus.TRIAL:
            return self.trial_ends_at is not None and self.trial_ends_at > now
        return False

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name) or "org"
            slug = base
            i = 1
            while Organization.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                i += 1
                slug = f"{base}-{i}"
            self.slug = slug
        self.currency_exponent = CURRENCY_EXPONENTS.get(self.currency, 0)
        super().save(*args, **kwargs)


class PlatformSubscriptionConfig(models.Model):
    """
    Configuration globale des tarifs et paramètres d'abonnement StockPro,
    modifiable à tout moment par les administrateurs depuis Django Admin.
    """
    default_monthly_price = models.PositiveIntegerField(
        default=5000,
        help_text="Tarif mensuel global par défaut en FCFA (ex: 5000)."
    )
    default_quarterly_price = models.PositiveIntegerField(
        default=12500,
        help_text="Tarif trimestriel global par défaut en FCFA (ex: 12500)."
    )
    trial_days = models.PositiveSmallIntegerField(
        default=7,
        help_text="Durée de la période d'essai gratuit en jours (0 = désactivé)."
    )
    support_phone = models.CharField(
        max_length=32,
        default="+22943507805",
        help_text="Numéro WhatsApp d'assistance et de contact sur-mesure."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuration globale des abonnements"
        verbose_name_plural = "Configuration globale des abonnements"

    def __str__(self):
        return f"Tarifs globaux: {self.default_monthly_price} F/mois | {self.default_quarterly_price} F/trimestre"

    @classmethod
    def get_config(cls):
        obj = cls.objects.first()
        if not obj:
            obj = cls.objects.create(
                default_monthly_price=5000,
                default_quarterly_price=12500,
                trial_days=7,
                support_phone="+22943507805",
            )
        return obj


class DocumentSequence(models.Model):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="sequences"
    )
    kind = models.CharField(max_length=20)
    last_value = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "kind"], name="uniq_org_document_kind"
            )
        ]


class SubscriptionPayment(TimeStampedModel):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="subscription_payments"
    )
    reference = models.CharField(max_length=64, unique=True)
    plan = models.CharField(max_length=20, choices=SubscriptionPlan.choices)
    amount = models.PositiveIntegerField(help_text="Montant en FCFA")
    currency = models.CharField(max_length=3, default="XOF")
    alphapay_checkout_id = models.CharField(max_length=128, blank=True, null=True)
    alphapay_slug = models.CharField(max_length=128, blank=True, null=True)
    status = models.CharField(
        max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING
    )
    paid_at = models.DateTimeField(null=True, blank=True)
    customer_phone = models.CharField(max_length=32, blank=True)
    customer_email = models.EmailField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reference} - {self.organization.name} ({self.amount} {self.currency})"
