from rest_framework.routers import DefaultRouter

from apps.suppliers.views import SupplierViewSet

router = DefaultRouter()
router.register("suppliers", SupplierViewSet, basename="suppliers")
urlpatterns = router.urls
