from django.db.models import F
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import require_permission
from apps.core.viewsets import restrict_to_allowed_warehouses
from apps.inventory.models import InventoryCount, StockMovement, StockPosition, Transfer
from apps.purchases.models import Purchase, PurchaseReceipt
from apps.reports.exports import csv_response
from apps.reports.periods import parse_period
from apps.reports.services import (
    completed_sales,
    ordered_purchases,
    purchases_summary,
    sales_summary,
)
from apps.sales.models import Sale

MOVEMENT_LABELS = dict(StockMovement._meta.get_field("type").choices)
SALE_STATUS_LABELS = {"DRAFT": "Brouillon", "COMPLETED": "Validée", "CANCELLED": "Annulée"}
PURCHASE_STATUS_LABELS = {
    "DRAFT": "Brouillon",
    "CONFIRMED": "Confirmé",
    "PARTIALLY_RECEIVED": "Reçu partiellement",
    "RECEIVED": "Reçu",
    "CANCELLED": "Annulé",
}


def _warehouse(request):
    return request.query_params.get("warehouse") or None


def _date(value):
    return value.strftime("%d/%m/%Y")


class SalesSummaryView(APIView):
    permission_classes = [require_permission("reports.view")]

    def get(self, request):
        date_from, date_to = parse_period(request.query_params, request.organization)
        return Response(
            sales_summary(request.organization, request.membership, date_from, date_to, _warehouse(request))
        )


class PurchasesSummaryView(APIView):
    permission_classes = [require_permission("reports.view")]

    def get(self, request):
        date_from, date_to = parse_period(request.query_params, request.organization)
        return Response(
            purchases_summary(request.organization, request.membership, date_from, date_to, _warehouse(request))
        )


class ExportView(APIView):
    """Exports CSV (§41) : mêmes filtres et mêmes droits que l'écran."""

    permission_classes = [require_permission("reports.export")]

    def get(self, request, kind):
        handler = getattr(self, f"export_{kind.replace('-', '_')}", None)
        if handler is None:
            return Response(
                {"error": {"code": "not_found", "message": "Export inconnu."}}, status=404
            )
        return handler(request)

    def _period(self, request):
        return parse_period(request.query_params, request.organization)

    def export_sales(self, request):
        date_from, date_to = self._period(request)
        sales = completed_sales(
            request.organization, request.membership, date_from, date_to, _warehouse(request)
        ).select_related("customer", "warehouse", "created_by").order_by("sale_date", "reference")
        rows = (
            [
                _date(s.sale_date),
                s.reference,
                s.customer.name if s.customer_id else "",
                s.warehouse.name,
                SALE_STATUS_LABELS.get(s.status, s.status),
                s.subtotal,
                s.discount,
                s.tax,
                s.total,
                s.created_by.full_name if s.created_by_id else "",
            ]
            for s in sales
        )
        return csv_response(
            f"ventes_{date_from}_{date_to}.csv",
            ["Date", "Référence", "Client", "Dépôt", "Statut", "Sous-total", "Remise", "TVA", "Total", "Vendeur"],
            rows,
        )

    def export_products(self, request):
        date_from, date_to = self._period(request)
        summary = sales_summary(
            request.organization, request.membership, date_from, date_to, _warehouse(request)
        )
        show_cost = request.membership.has_perm("prices.view_cost")
        header = ["SKU", "Produit", "Catégorie", "Quantité vendue", "CA TTC"]
        if show_cost:
            header += ["Coût", "Marge"]
        rows = (
            [p["sku"], p["name"], p["category"], p["quantity"], p["revenue"]]
            + ([p["cost"], p["margin"]] if show_cost else [])
            for p in summary["products"]
        )
        return csv_response(f"ventes_par_produit_{date_from}_{date_to}.csv", header, rows)

    def export_stock(self, request):
        positions = StockPosition.objects.filter(
            organization=request.organization, product__is_active=True
        ).select_related("product", "warehouse").order_by("product__name", "warehouse__name")
        if _warehouse(request):
            positions = positions.filter(warehouse_id=_warehouse(request))
        positions = restrict_to_allowed_warehouses(positions, request.membership)
        show_cost = request.membership.has_perm("prices.view_cost")
        header = ["Produit", "SKU", "Dépôt", "Quantité", "Unité", "Seuil minimum"]
        if show_cost:
            header += ["Prix d'achat", "Valeur"]
        rows = (
            [
                p.product.name,
                p.product.sku,
                p.warehouse.name,
                p.quantity,
                p.product.unit,
                p.product.minimum_stock,
            ]
            + ([p.product.purchase_price, p.quantity * p.product.purchase_price] if show_cost else [])
            for p in positions
        )
        return csv_response("stock.csv", header, rows)

    def export_movements(self, request):
        date_from, date_to = self._period(request)
        movements = StockMovement.objects.filter(
            organization=request.organization, created_at__date__range=(date_from, date_to)
        ).select_related("product", "warehouse", "created_by").order_by("created_at")
        if _warehouse(request):
            movements = movements.filter(warehouse_id=_warehouse(request))
        if request.query_params.get("product"):
            movements = movements.filter(product_id=request.query_params["product"])
        movements = list(restrict_to_allowed_warehouses(movements, request.membership))
        references = _document_references(request.organization, movements)
        rows = (
            [
                m.created_at.strftime("%d/%m/%Y %H:%M"),
                m.product.name,
                m.product.sku,
                MOVEMENT_LABELS.get(m.type, m.type),
                m.quantity,
                m.warehouse.name,
                m.created_by.full_name if m.created_by_id else "",
                references.get((m.reference_type, m.reference_id), m.reason),
            ]
            for m in movements
        )
        return csv_response(
            f"mouvements_{date_from}_{date_to}.csv",
            ["Date", "Produit", "SKU", "Type", "Quantité", "Dépôt", "Utilisateur", "Référence"],
            rows,
        )

    def export_inventory(self, request):
        inventory = (
            restrict_to_allowed_warehouses(
                InventoryCount.objects.filter(organization=request.organization), request.membership
            )
            .select_related("warehouse")
            .filter(pk=request.query_params.get("inventory"))
            .first()
            if request.query_params.get("inventory")
            else None
        )
        if inventory is None:
            return Response(
                {"error": {"code": "not_found", "message": "Inventaire introuvable."}}, status=404
            )
        show_cost = request.membership.has_perm("prices.view_cost")
        header = ["Produit", "SKU", "Stock théorique", "Stock réel", "Écart"]
        if show_cost:
            header += ["Prix d'achat", "Valeur de l'écart"]
        lines = inventory.lines.select_related("product").order_by("product__name")

        def row(line):
            counted = "" if line.counted_quantity is None else line.counted_quantity
            difference = "" if line.difference is None else line.difference
            values = [line.product.name, line.product.sku, line.expected_quantity, counted, difference]
            if show_cost:
                value = "" if line.difference is None else line.difference * line.product.purchase_price
                values += [line.product.purchase_price, value]
            return values

        return csv_response(
            f"inventaire_{inventory.reference}.csv", header, (row(line) for line in lines)
        )

    def export_purchases(self, request):
        date_from, date_to = self._period(request)
        purchases = ordered_purchases(
            request.organization, request.membership, date_from, date_to, _warehouse(request)
        ).select_related("supplier", "warehouse").order_by("purchase_date", "reference")
        rows = (
            [
                _date(p.purchase_date),
                p.reference,
                p.supplier.name,
                p.warehouse.name,
                PURCHASE_STATUS_LABELS.get(p.status, p.status),
                p.total,
            ]
            for p in purchases
        )
        return csv_response(
            f"achats_{date_from}_{date_to}.csv",
            ["Date", "Référence", "Fournisseur", "Dépôt", "Statut", "Total"],
            rows,
        )


def _document_references(org, movements):
    """Référence lisible (V-000012, TR-000003…) des documents à l'origine des mouvements."""
    ids = {"sale": set(), "purchase_receipt": set(), "transfer": set(), "inventory": set()}
    for m in movements:
        if m.reference_type in ids and m.reference_id:
            ids[m.reference_type].add(m.reference_id)
    labels = {}
    for pk, ref in Sale.objects.filter(organization=org, id__in=ids["sale"]).values_list("id", "reference"):
        labels[("sale", str(pk))] = ref
    for pk, ref in Transfer.objects.filter(organization=org, id__in=ids["transfer"]).values_list(
        "id", "reference"
    ):
        labels[("transfer", str(pk))] = ref
    for pk, ref in InventoryCount.objects.filter(organization=org, id__in=ids["inventory"]).values_list(
        "id", "reference"
    ):
        labels[("inventory", str(pk))] = ref
    receipts = PurchaseReceipt.objects.filter(organization=org, id__in=ids["purchase_receipt"]).annotate(
        purchase_ref=F("purchase__reference")
    )
    for receipt in receipts:
        labels[("purchase_receipt", str(receipt.id))] = f"{receipt.purchase_ref} / {receipt.reference}"
    return labels
