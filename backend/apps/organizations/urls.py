from django.urls import path

from .views import DashboardView, OrganizationMeView
from .billing_views import (
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
