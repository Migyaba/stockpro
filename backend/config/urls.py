from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.utils import extend_schema
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Système"],
        auth=[],
        summary="Santé du service",
        responses={200: {"type": "object", "properties": {"status": {"type": "string"}, "service": {"type": "string"}}}},
    )
    def get(self, _request):
        return Response({"status": "ok", "service": "stockpro"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", HealthView.as_view()),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.accounts.tenant_urls")),
    path("api/", include("apps.organizations.urls")),
    path("api/", include("apps.products.urls")),
    path("api/", include("apps.inventory.urls")),
    path("api/", include("apps.customers.urls")),
    path("api/", include("apps.suppliers.urls")),
    path("api/", include("apps.purchases.urls")),
    path("api/", include("apps.sales.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
