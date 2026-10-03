from django.db.models import F, Sum
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import require_permission
from apps.inventory.models import StockPosition
from apps.organizations.serializers import DashboardSerializer, OrganizationSerializer
from apps.products.models import Product
from apps.sales.models import Sale, SaleStatus


class OrganizationMeView(APIView):
    serializer_class = OrganizationSerializer
    def get(self, request):
        return Response(OrganizationSerializer(request.organization).data)

    def patch(self, request):
        if not request.membership.has_perm("settings.update"):
            return Response(status=403)
        serializer = OrganizationSerializer(
            request.organization, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class DashboardView(APIView):
    permission_classes = [require_permission("products.view")]
    serializer_class = DashboardSerializer

    def get(self, request):
        org = request.organization
        today = timezone.localdate()
        sales_today = Sale.objects.filter(
            organization=org, status=SaleStatus.COMPLETED, sale_date=today
        )
        positions = StockPosition.objects.filter(organization=org).select_related("product")
        low = [
            p
            for p in positions
            if p.product.minimum_stock and p.quantity <= p.product.minimum_stock
        ]
        out = [p for p in positions if p.quantity == 0]
        stock_value = (
            positions.annotate(value=F("quantity") * F("product__purchase_price")).aggregate(
                total=Sum("value")
            )["total"]
            or 0
        )
        recent = (
            Sale.objects.filter(organization=org)
            .order_by("-created_at")[:8]
            .values("id", "reference", "status", "total", "sale_date")
        )
        return Response(
            {
                "products_count": Product.objects.filter(organization=org, is_active=True).count(),
                "stock_value": stock_value,
                "sales_today_count": sales_today.count(),
                "sales_today_total": sales_today.aggregate(t=Sum("total"))["t"] or 0,
                "low_stock_count": len(low),
                "out_of_stock_count": len(out),
                "warehouses_count": org.inventory_warehouse_set.filter(is_active=True).count(),
                "recent_sales": list(recent),
            }
        )
