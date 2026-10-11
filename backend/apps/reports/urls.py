from django.urls import path

from apps.reports.views import ExportView, PurchasesSummaryView, SalesSummaryView

urlpatterns = [
    path("reports/sales-summary/", SalesSummaryView.as_view()),
    path("reports/purchases-summary/", PurchasesSummaryView.as_view()),
    path("reports/export/<slug:kind>/", ExportView.as_view()),
]
