from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.inventory.views import (
    InventoryCountViewSet,
    StockAlertView,
    MovementViewSet,
    StockViewSet,
    TransferViewSet,
    WarehouseViewSet,
)

router = DefaultRouter()
router.register("warehouses", WarehouseViewSet, basename="warehouses")
router.register("stock", StockViewSet, basename="stock")
router.register("movements", MovementViewSet, basename="movements")
router.register("transfers", TransferViewSet, basename="transfers")
router.register("inventories", InventoryCountViewSet, basename="inventories")

urlpatterns = [path("alerts/stock/", StockAlertView.as_view()), *router.urls]
