from datetime import timedelta

from django.db import transaction
from django.db.models import F, Sum
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.services import AuditAction, diff, snapshot, write_audit
from apps.core.permissions import require_permission
from apps.core.viewsets import restrict_to_allowed_warehouses
from apps.inventory.models import StockPosition
from apps.organizations.serializers import DashboardSerializer, OrganizationSerializer
from apps.products.models import Product
from apps.purchases.models import Purchase, PurchaseStatus
from apps.reports.periods import organization_today
from apps.reports.services import ordered_purchases, sales_summary
from apps.sales.models import Sale, SaleStatus


class OrganizationMeView(APIView):
    serializer_class = OrganizationSerializer
    def get(self, request):
        return Response(OrganizationSerializer(request.organization).data)

    def patch(self, request):
        if not request.membership.has_perm("settings.update"):
            raise PermissionDenied()
        serializer = OrganizationSerializer(
            request.organization, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        fields = list(serializer.validated_data)
        before = snapshot(request.organization, fields)
        with transaction.atomic():
            serializer.save()
            old, new = diff(before, snapshot(serializer.instance, fields))
            if new:
                write_audit(
                    request, action=AuditAction.UPDATE, entity=serializer.instance, old_values=old, extra=new
                )
        return Response(serializer.data)


class DashboardView(APIView):
    permission_classes = [require_permission("products.view")]
    serializer_class = DashboardSerializer

    def get(self, request):
        org = request.organization
        membership = request.membership
        today = organization_today(org)
        sales = restrict_to_allowed_warehouses(Sale.objects.filter(organization=org), membership)
        sales_today = sales.filter(status=SaleStatus.COMPLETED, sale_date=today)
        sales_today_total = sales_today.aggregate(t=Sum("total"))["t"] or 0
        positions = restrict_to_allowed_warehouses(
            StockPosition.objects.filter(organization=org, product__is_active=True), membership
        )
        low_stock_count = positions.filter(
            product__minimum_stock__gt=0,
            quantity__gt=0,
            quantity__lte=F("product__minimum_stock"),
        ).count()
        out_of_stock_count = positions.filter(quantity=0).count()
        stock_value = (
            positions.annotate(value=F("quantity") * F("product__purchase_price")).aggregate(
                total=Sum("value")
            )["total"]
            or 0
        )
        pending_purchases = restrict_to_allowed_warehouses(
            Purchase.objects.filter(
                organization=org,
                status__in=[
                    PurchaseStatus.DRAFT,
                    PurchaseStatus.CONFIRMED,
                    PurchaseStatus.PARTIALLY_RECEIVED,
                ],
            ),
            membership,
        ).count()
        recent = sales.order_by("-created_at")[:8].values(
            "id", "reference", "status", "total", "sale_date"
        )
        # §39 : semaine glissante, mois en cours, achats du mois et marge.
        month_start = today.replace(day=1)
        week = sales.filter(
            status=SaleStatus.COMPLETED, sale_date__range=(today - timedelta(days=6), today)
        ).aggregate(t=Sum("total"))["t"] or 0
        month = sales_summary(org, membership, month_start, today)["totals"]
        purchases_month = (
            ordered_purchases(org, membership, month_start, today).aggregate(t=Sum("total"))["t"] or 0
        )
        warehouses = restrict_to_allowed_warehouses(
            org.inventory_warehouse_set.filter(is_active=True), membership, field="id"
        )
        return Response(
            {
                "products_count": Product.objects.filter(organization=org, is_active=True).count(),
                # Valeur au prix d'achat : masquée aux rôles sans accès aux coûts.
                "stock_value": stock_value if membership.has_perm("prices.view_cost") else 0,
                "sales_today": sales_today_total,
                "sales_today_total": sales_today_total,
                "sales_today_count": sales_today.count(),
                "low_stock_count": low_stock_count,
                "out_of_stock_count": out_of_stock_count,
                "pending_purchases": pending_purchases,
                "warehouses_count": warehouses.count(),
                "sales_week_total": week,
                "sales_month_total": month["revenue"],
                "sales_month_count": month["count"],
                "sales_month_evolution_pct": month["revenue_evolution_pct"],
                "purchases_month_total": purchases_month,
                # Marge du mois : absente pour les rôles sans accès aux coûts.
                "margin_month": month.get("margin"),
                "margin_month_pct": month.get("margin_pct"),
                "recent_sales": list(recent),
            }
        )


