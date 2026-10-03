from rest_framework.routers import DefaultRouter

from apps.inventory.views import MovementViewSet, StockViewSet, TransferViewSet, WarehouseViewSet

router = DefaultRouter()
router.register("warehouses", WarehouseViewSet, basename="warehouses")
router.register("stock", StockViewSet, basename="stock")
router.register("movements", MovementViewSet, basename="movements")
router.register("transfers", TransferViewSet, basename="transfers")

urlpatterns = router.urls
