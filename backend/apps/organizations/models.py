from django.db import models
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
        max_length=20, choices=OrganizationStatus.choices, default=OrganizationStatus.TRIAL
    )
    trial_ends_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

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
