"""Agrégats des rapports (§38-40).

Marge = CA hors taxe − coût. Le coût vient des mouvements SALE, qui figent le
prix d'achat au moment de la validation : modifier le prix catalogue ensuite
ne réécrit pas les marges passées.
"""

from collections import defaultdict
from datetime import timedelta

from django.db.models import Count, F, Sum

from apps.core.viewsets import restrict_to_allowed_warehouses
from apps.inventory.models import MovementType, StockMovement
from apps.purchases.models import Purchase, PurchaseReceiptItem, PurchaseStatus
from apps.reports.periods import previous_period
from apps.sales.models import Sale, SaleItem, SaleStatus

TOP_LIMIT = 10


def completed_sales(org, membership, date_from, date_to, warehouse_id=None):
    qs = Sale.objects.filter(
        organization=org, status=SaleStatus.COMPLETED, sale_date__range=(date_from, date_to)
    )
    if warehouse_id:
        qs = qs.filter(warehouse_id=warehouse_id)
    return restrict_to_allowed_warehouses(qs, membership)


def _sale_costs(org, sale_ids):
    """Coût par vente et par produit, depuis les mouvements de sortie."""
    by_sale = defaultdict(int)
    by_product = defaultdict(int)
    movements = StockMovement.objects.filter(
        organization=org,
        type=MovementType.SALE,
        reference_type="sale",
        reference_id__in=[str(i) for i in sale_ids],
    ).values_list("reference_id", "product_id", "quantity", "unit_cost")
    for sale_id, product_id, quantity, unit_cost in movements:
        cost = -quantity * unit_cost  # quantité négative : sortie de stock
        by_sale[sale_id] += cost
        by_product[product_id] += cost
    return by_sale, by_product


def _evolution(current, previous):
    if not previous:
        return None
    return round((current - previous) * 100 / previous, 1)


def sales_summary(org, membership, date_from, date_to, warehouse_id=None):
    show_cost = membership.has_perm("prices.view_cost")
    sales = list(
        completed_sales(org, membership, date_from, date_to, warehouse_id).values(
            "id", "sale_date", "total", "tax", "discount", "warehouse_id", "warehouse__name"
        )
    )
    sale_ids = [s["id"] for s in sales]
    cost_by_sale, cost_by_product = _sale_costs(org, sale_ids)

    revenue = sum(s["total"] for s in sales)
    tax = sum(s["tax"] for s in sales)
    cost = sum(cost_by_sale.values())
    revenue_excl_tax = revenue - tax
    margin = revenue_excl_tax - cost

    # Série quotidienne continue (jours sans vente à 0) pour les graphiques.
    days = {
        date_from + timedelta(days=i): {"revenue": 0, "count": 0, "margin": 0}
        for i in range((date_to - date_from).days + 1)
    }
    warehouses = {}
    for s in sales:
        day = days[s["sale_date"]]
        day["revenue"] += s["total"]
        day["count"] += 1
        day["margin"] += s["total"] - s["tax"] - cost_by_sale.get(str(s["id"]), 0)
        wh = warehouses.setdefault(
            s["warehouse_id"], {"id": str(s["warehouse_id"]), "name": s["warehouse__name"], "revenue": 0, "count": 0}
        )
        wh["revenue"] += s["total"]
        wh["count"] += 1

    product_rows = (
        SaleItem.objects.filter(sale_id__in=sale_ids)
        .values("product_id", "product__name", "product__sku", "product__category__name")
        .annotate(quantity=Sum("quantity"), revenue=Sum("total"), tax=Sum("tax"))
    )
    products = []
    categories = defaultdict(lambda: {"revenue": 0, "quantity": 0})
    for row in product_rows:
        product_cost = cost_by_product.get(row["product_id"], 0)
        item = {
            "id": str(row["product_id"]),
            "name": row["product__name"],
            "sku": row["product__sku"],
            "category": row["product__category__name"] or "Sans catégorie",
            "quantity": row["quantity"],
            "revenue": row["revenue"],
        }
        if show_cost:
            item["cost"] = product_cost
            item["margin"] = row["revenue"] - row["tax"] - product_cost
        products.append(item)
        categories[item["category"]]["revenue"] += row["revenue"]
        categories[item["category"]]["quantity"] += row["quantity"]

    prev_from, prev_to = previous_period(date_from, date_to)
    previous_revenue = (
        completed_sales(org, membership, prev_from, prev_to, warehouse_id).aggregate(t=Sum("total"))["t"] or 0
    )

    by_revenue = sorted(products, key=lambda p: p["revenue"], reverse=True)
    totals = {
        "revenue": revenue,
        "revenue_excl_tax": revenue_excl_tax,
        "tax": tax,
        "discount": sum(s["discount"] for s in sales),
        "count": len(sales),
        "average_ticket": round(revenue / len(sales)) if sales else 0,
        "previous_revenue": previous_revenue,
        "revenue_evolution_pct": _evolution(revenue, previous_revenue),
    }
    if show_cost:
        totals.update(
            cost=cost,
            margin=margin,
            margin_pct=round(margin * 100 / revenue_excl_tax, 1) if revenue_excl_tax else None,
        )
    series = [{"date": d.isoformat(), **values} for d, values in days.items()]
    if not show_cost:
        for point in series:
            point.pop("margin")

    return {
        "period": {"date_from": date_from.isoformat(), "date_to": date_to.isoformat()},
        "previous_period": {"date_from": prev_from.isoformat(), "date_to": prev_to.isoformat()},
        "totals": totals,
        "series": series,
        "top_products": by_revenue[:TOP_LIMIT],
        "least_products": list(reversed(by_revenue[-TOP_LIMIT:])) if len(by_revenue) > TOP_LIMIT else [],
        "by_warehouse": sorted(warehouses.values(), key=lambda w: w["revenue"], reverse=True),
        "by_category": sorted(
            ({"name": name, **values} for name, values in categories.items()),
            key=lambda c: c["revenue"],
            reverse=True,
        ),
        "products": by_revenue,
    }


def ordered_purchases(org, membership, date_from, date_to, warehouse_id=None):
    qs = Purchase.objects.filter(
        organization=org, purchase_date__range=(date_from, date_to)
    ).exclude(status__in=[PurchaseStatus.DRAFT, PurchaseStatus.CANCELLED])
    if warehouse_id:
        qs = qs.filter(warehouse_id=warehouse_id)
    return restrict_to_allowed_warehouses(qs, membership)


def purchases_summary(org, membership, date_from, date_to, warehouse_id=None):
    purchases = ordered_purchases(org, membership, date_from, date_to, warehouse_id)
    totals = purchases.aggregate(ordered=Sum("total"), count=Count("id"))
    prev_from, prev_to = previous_period(date_from, date_to)
    previous = (
        ordered_purchases(org, membership, prev_from, prev_to, warehouse_id).aggregate(t=Sum("total"))["t"] or 0
    )
    receipts = PurchaseReceiptItem.objects.filter(
        receipt__organization=org,
        receipt__received_at__date__range=(date_from, date_to),
    )
    if warehouse_id:
        receipts = receipts.filter(receipt__warehouse_id=warehouse_id)
    receipts = restrict_to_allowed_warehouses(receipts, membership, field="receipt__warehouse_id")
    received = receipts.aggregate(v=Sum(F("quantity") * F("purchase_item__unit_price")))["v"] or 0
    suppliers = (
        purchases.values("supplier_id", "supplier__name")
        .annotate(total=Sum("total"), count=Count("id"))
        .order_by("-total")[:TOP_LIMIT]
    )
    ordered = totals["ordered"] or 0
    return {
        "period": {"date_from": date_from.isoformat(), "date_to": date_to.isoformat()},
        "totals": {
            "ordered": ordered,
            "count": totals["count"],
            "received_value": received,
            "previous_ordered": previous,
            "ordered_evolution_pct": _evolution(ordered, previous),
        },
        "top_suppliers": [
            {"id": str(s["supplier_id"]), "name": s["supplier__name"], "total": s["total"], "count": s["count"]}
            for s in suppliers
        ],
    }
