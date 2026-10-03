from django.urls import path

from apps.organizations.views import DashboardView, OrganizationMeView

urlpatterns = [
    path("organizations/me/", OrganizationMeView.as_view()),
    path("dashboard/", DashboardView.as_view()),
]
