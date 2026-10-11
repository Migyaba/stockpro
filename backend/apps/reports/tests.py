import csv
import io
from datetime import timedelta
from unittest import mock

from apps.accounts.models import Membership, Role
from apps.core import permissions
from apps.core.tests_security import SecurityTestCase
from apps.organizations.models import Organization
from apps.reports.periods import organization_today


class SalesReportTests(SecurityTestCase):
    """Produit de setUp : prix d'achat 600, prix de vente 1000, 20 en stock."""

    def sell(self, quantity=1, unit_price=None):
        sale_id = self.create_sale(quantity=quantity, unit_price=unit_price)
        res = self.client.post(f"/api/sales/{sale_id}/complete/")
        self.assertEqual(res.status_code, 200, res.data)
        return sale_id

    def summary(self, **params):
        res = self.client.get("/api/reports/sales-summary/", params)
        self.assertEqual(res.status_code, 200, res.data)
        return res.data

    def test_margin_uses_cost_at_time_of_sale(self):
        self.sell(quantity=2)
        # Le prix d'achat change ensuite : la marge déjà réalisée ne doit pas bouger.
        self.client.patch(f"/api/products/{self.product_id}/", {"purchase_price": 900}, format="json")
        totals = self.summary()["totals"]
        self.assertEqual(totals["revenue"], 2000)
        self.assertEqual(totals["cost"], 1200)
        self.assertEqual(totals["margin"], 800)
        self.assertEqual(totals["margin_pct"], 40.0)
        self.assertEqual(totals["count"], 1)

    def test_margin_excludes_tax_and_cancelled_sales(self):
        Organization.objects.filter(pk=self.org.pk).update(
            tax_enabled=True, tax_rate_bps=1800, prices_include_tax=True
        )
        self.sell()
        cancelled = self.sell()
        self.client.post(f"/api/sales/{cancelled}/cancel/")
        totals = self.summary()["totals"]
        self.assertEqual(totals["revenue"], 1000)
        self.assertEqual(totals["tax"], 153)
        self.assertEqual(totals["margin"], 1000 - 153 - 600)

    def test_series_top_products_and_evolution(self):
        self.sell(quantity=3)
        data = self.summary()
        self.assertEqual(len(data["series"]), 30)
        self.assertEqual(data["series"][-1]["revenue"], 3000)
        self.assertEqual(data["top_products"][0]["quantity"], 3)
        self.assertEqual(data["by_warehouse"][0]["revenue"], 3000)
        self.assertIsNone(data["totals"]["revenue_evolution_pct"])  # rien sur la période précédente

    def test_period_filter(self):
        self.sell()
        yesterday = organization_today(self.org) - timedelta(days=1)
        data = self.summary(date_from=str(yesterday - timedelta(days=5)), date_to=str(yesterday))
        self.assertEqual(data["totals"]["revenue"], 0)
        bad = self.client.get("/api/reports/sales-summary/", {"date_from": "2026-02-01", "date_to": "2026-01-01"})
        self.assertEqual(bad.status_code, 400)

    def test_staff_has_no_report_access(self):
        _, staff = self.member(Role.STAFF)
        self.auth(staff)
        self.assertEqual(self.client.get("/api/reports/sales-summary/").status_code, 403)
        self.assertEqual(self.client.get("/api/reports/export/sales/").status_code, 403)

    def test_dashboard_month_kpis(self):
        self.sell(quantity=2)
        data = self.client.get("/api/dashboard/").data
        self.assertEqual(data["sales_month_total"], 2000)
        self.assertEqual(data["margin_month"], 800)
        _, staff = self.member(Role.STAFF)
        self.auth(staff)
        self.assertIsNone(self.client.get("/api/dashboard/").data["margin_month"])


class ExportTests(SecurityTestCase):
    def read_csv(self, path, **params):
        res = self.client.get(path, params)
        self.assertEqual(res.status_code, 200)
        self.assertIn("text/csv", res["Content-Type"])
        content = res.content.decode("utf-8")
        self.assertTrue(content.startswith("\ufeff"))
        return list(csv.reader(io.StringIO(content.lstrip("\ufeff")), delimiter=";"))

    def test_sales_and_movements_exports(self):
        sale_id = self.create_sale(quantity=2)
        self.client.post(f"/api/sales/{sale_id}/complete/")
        sales = self.read_csv("/api/reports/export/sales/")
        self.assertEqual(sales[0][0], "Date")
        self.assertEqual(len(sales), 2)
        movements = self.read_csv("/api/reports/export/movements/")
        references = [row[-1] for row in movements[1:]]
        self.assertIn("V-000001", references)

    def test_stock_export_hides_cost_without_permission(self):
        self.assertIn("Valeur", self.read_csv("/api/reports/export/stock/")[0])
        # Rôle exportant sans voir les coûts : les colonnes de prix d'achat disparaissent.
        manager_perms = permissions.ROLE_PERMISSIONS["MANAGER"] - {"prices.view_cost"}
        Membership.objects.filter(organization=self.org).update(role=Role.MANAGER)
        with mock.patch.dict(permissions.ROLE_PERMISSIONS, {"MANAGER": manager_perms}):
            header = self.read_csv("/api/reports/export/stock/")[0]
        self.assertNotIn("Valeur", header)
        self.assertNotIn("Prix d'achat", header)

    def test_formula_injection_is_neutralised(self):
        self.client.patch(
            f"/api/products/{self.product_id}/", {"name": '=HYPERLINK("http://x")'}, format="json"
        )
        rows = self.read_csv("/api/reports/export/stock/")
        self.assertTrue(rows[1][0].startswith("'="))

    def test_unknown_export_is_404(self):
        self.assertEqual(self.client.get("/api/reports/export/nope/").status_code, 404)
