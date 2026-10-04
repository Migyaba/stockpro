from django.urls import path

from apps.organizations.views import DashboardView, OrganizationMeView
from apps.organizations.billing_views import (
    SubscriptionStatusView,
    CheckoutSessionView,
    AlphaPayWebhookView,
)

urlpatterns = [
    path("organizations/me/", OrganizationMeView.as_view()),
    path("dashboard/", DashboardView.as_view()),
    path("billing/subscription/", SubscriptionStatusView.as_view()),
    path("billing/checkout/", CheckoutSessionView.as_view()),
    path("billing/webhook/alphapay/", AlphaPayWebhookView.as_view()),
]
