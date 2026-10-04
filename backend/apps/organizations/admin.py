from django.contrib import admin
from apps.organizations.models import (
    DocumentSequence,
    Organization,
    PlatformSubscriptionConfig,
    SubscriptionPayment,
)


@admin.register(PlatformSubscriptionConfig)
class PlatformSubscriptionConfigAdmin(admin.ModelAdmin):
    list_display = (
        "__str__",
        "default_monthly_price",
        "default_quarterly_price",
        "trial_days",
        "support_phone",
        "updated_at",
    )

    fieldsets = (
        (
            "Tarifs Généraux de la Plateforme StockPro",
            {
                "description": (
                    "Ces montants s'appliquent à tous les clients qui n'ont pas de tarif personnalisé négocié."
                ),
                "fields": ("default_monthly_price", "default_quarterly_price"),
            },
        ),
        (
            "Paramètres d'Essai & Support",
            {
                "fields": ("trial_days", "support_phone"),
            },
        ),
    )

    def has_add_permission(self, request):
        # Configuration unique (Singleton)
        if PlatformSubscriptionConfig.objects.exists():
            return False
        return super().has_add_permission(request)

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "status",
        "subscription_plan",
        "subscription_ends_at",
        "custom_monthly_price",
        "custom_quarterly_price",
        "phone",
        "email",
        "created_at",
    )
    list_filter = ("status", "subscription_plan", "country", "created_at")
    search_fields = ("name", "slug", "email", "phone")
    prepopulated_fields = {"slug": ("name",)}

    fieldsets = (
        (
            "Informations Générales",
            {
                "fields": (
                    "name",
                    "slug",
                    "logo",
                    "email",
                    "phone",
                    "address",
                    "country",
                    "currency",
                    "timezone",
                    "language",
                )
            },
        ),
        (
            "Statut & Validité de l'Abonnement",
            {
                "description": "État du compte de l'organisation et dates d'accès au service.",
                "fields": (
                    "status",
                    "subscription_plan",
                    "trial_ends_at",
                    "subscription_ends_at",
                ),
            },
        ),
        (
            "Tarification Sur-Mesure (Personnalisée)",
            {
                "description": (
                    "Définissez un tarif préférentiel en FCFA pour cette boutique. "
                    "Si laissé vide, les tarifs généraux de la plateforme s'appliqueront automatiquement."
                ),
                "fields": ("custom_monthly_price", "custom_quarterly_price"),
            },
        ),
        (
            "Fiscalité & Réductions",
            {
                "classes": ("collapse",),
                "fields": (
                    "tax_enabled",
                    "tax_rate_bps",
                    "prices_include_tax",
                    "max_discount_percent_manager",
                ),
            },
        ),
    )


@admin.register(SubscriptionPayment)
class SubscriptionPaymentAdmin(admin.ModelAdmin):
    list_display = (
        "reference",
        "organization",
        "plan",
        "amount",
        "currency",
        "status",
        "paid_at",
        "customer_phone",
        "created_at",
    )
    list_filter = ("status", "plan", "currency", "created_at")
    search_fields = (
        "reference",
        "organization__name",
        "customer_phone",
        "customer_email",
        "alphapay_checkout_id",
    )
    readonly_fields = (
        "reference",
        "organization",
        "alphapay_checkout_id",
        "alphapay_slug",
        "metadata",
        "created_at",
        "updated_at",
    )


@admin.register(DocumentSequence)
class DocumentSequenceAdmin(admin.ModelAdmin):
    list_display = ("organization", "kind", "last_value")
    list_filter = ("kind",)
    search_fields = ("organization__name", "kind")
