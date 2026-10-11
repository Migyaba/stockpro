from apps.accounts.models import Role
from apps.core.tests_security import SecurityTestCase
from apps.inventory.models import InventoryCount, StockMovement, StockPosition


class InventoryWorkflowTests(SecurityTestCase):
    """setUp : produit TS-1, 20 en stock dans le dépôt principal."""

    def setUp(self):
        super().setUp()
        self.other_id = self.create_product("TS-2", price=500, qty=0)
        self.client.patch(f"/api/products/{self.other_id}/", {"barcode": "3017620422003"}, format="json")

    def open_inventory(self):
        created = self.client.post("/api/inventories/", {"warehouse": self.warehouse_id}, format="json")
        self.assertEqual(created.status_code, 201, created.data)
        started = self.client.post(f"/api/inventories/{created.data['id']}/start/")
        self.assertEqual(started.status_code, 200, started.data)
        self.assertEqual(started.data["status"], "COUNTING")
        return created.data["id"]

    def count(self, inventory_id, lines):
        return self.client.post(f"/api/inventories/{inventory_id}/lines/", {"lines": lines}, format="json")

    def test_full_workflow_adjusts_stock(self):
        inv = self.open_inventory()
        self.assertEqual(self.client.get(f"/api/inventories/{inv}/").data["stats"]["lines"], 2)
        res = self.count(inv, [{"product": self.product_id, "counted_quantity": 18}])
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(res.data[0]["difference"], -2)
        # Scan du code-barres : +1 à chaque passage.
        self.count(inv, [{"code": "3017620422003", "add": 1}])
        self.count(inv, [{"code": "3017620422003", "add": 1}])
        self.assertEqual(self.client.post(f"/api/inventories/{inv}/review/").status_code, 200)
        done = self.client.post(f"/api/inventories/{inv}/validate/")
        self.assertEqual(done.status_code, 200, done.data)
        self.assertEqual(done.data["status"], "VALIDATED")
        self.assertEqual(self.stock(), 18)
        self.assertEqual(StockPosition.objects.get(product_id=self.other_id).quantity, 2)
        adjustments = StockMovement.objects.filter(type="INVENTORY_ADJUSTMENT", reference_id=inv)
        self.assertEqual(sorted(adjustments.values_list("quantity", flat=True)), [-2, 2])
        # Validé : plus modifiable.
        self.assertEqual(self.count(inv, [{"product": self.product_id, "counted_quantity": 1}]).status_code, 400)
        self.assertEqual(self.client.post(f"/api/inventories/{inv}/cancel/").status_code, 400)

    def test_uncounted_lines_are_ignored(self):
        inv = self.open_inventory()
        self.count(inv, [{"code": "TS-2", "counted_quantity": 0}])
        self.client.post(f"/api/inventories/{inv}/review/")
        self.client.post(f"/api/inventories/{inv}/validate/")
        self.assertEqual(self.stock(), 20)

    def test_only_one_open_inventory_per_warehouse(self):
        self.open_inventory()
        again = self.client.post("/api/inventories/", {"warehouse": self.warehouse_id}, format="json")
        self.assertEqual(again.status_code, 400)
        self.assertIn("INV-000001", again.data["error"]["message"])

    def test_cancel_has_no_stock_effect_and_frees_warehouse(self):
        inv = self.open_inventory()
        self.count(inv, [{"product": self.product_id, "counted_quantity": 5}])
        self.assertEqual(self.client.post(f"/api/inventories/{inv}/cancel/").status_code, 200)
        self.assertEqual(self.stock(), 20)
        self.open_inventory()

    def test_staff_counts_blind_and_cannot_validate(self):
        inv = self.open_inventory()
        _, staff = self.member(Role.STAFF)
        self.auth(staff)
        self.assertEqual(
            self.client.post("/api/inventories/", {"warehouse": self.warehouse_id}, format="json").status_code, 403
        )
        res = self.count(inv, [{"product": self.product_id, "counted_quantity": 19}])
        self.assertEqual(res.status_code, 200, res.data)
        self.assertNotIn("expected_quantity", res.data[0])
        listed = self.client.get(f"/api/inventories/{inv}/lines/").data["results"]
        self.assertNotIn("difference", listed[0])
        self.assertNotIn("differences", self.client.get(f"/api/inventories/{inv}/").data["stats"])
        self.assertEqual(self.client.post(f"/api/inventories/{inv}/review/").status_code, 200)
        self.assertEqual(self.client.post(f"/api/inventories/{inv}/validate/").status_code, 403)

    def test_stock_drop_during_count_blocks_negative_adjustment(self):
        inv = self.open_inventory()
        self.count(inv, [{"product": self.product_id, "counted_quantity": 0}])
        self.client.post(f"/api/inventories/{inv}/review/")
        # Pendant la revue, une vente sort 15 unités : l'écart -20 rendrait le stock négatif.
        sale = self.create_sale(quantity=15)
        self.client.post(f"/api/sales/{sale}/complete/")
        res = self.client.post(f"/api/inventories/{inv}/validate/")
        self.assertEqual(res.status_code, 400)
        self.assertIn("Rouvrez le comptage", res.data["error"]["message"])
        self.assertEqual(self.stock(), 5)
        self.assertEqual(InventoryCount.objects.get(pk=inv).status, "REVIEW")

    def test_validation_is_idempotent(self):
        inv = self.open_inventory()
        self.count(inv, [{"product": self.product_id, "counted_quantity": 25}])
        self.client.post(f"/api/inventories/{inv}/review/")
        headers = {"HTTP_IDEMPOTENCY_KEY": "inv-1"}
        self.assertEqual(self.client.post(f"/api/inventories/{inv}/validate/", **headers).status_code, 200)
        self.assertEqual(self.client.post(f"/api/inventories/{inv}/validate/", **headers).status_code, 200)
        self.assertEqual(self.stock(), 25)

    def test_unknown_code_is_rejected(self):
        inv = self.open_inventory()
        res = self.count(inv, [{"code": "INCONNU", "add": 1}])
        self.assertEqual(res.status_code, 400)

    def test_inventory_report_export(self):
        inv = self.open_inventory()
        self.count(inv, [{"product": self.product_id, "counted_quantity": 17}])
        res = self.client.get("/api/reports/export/inventory/", {"inventory": inv})
        self.assertEqual(res.status_code, 200)
        content = res.content.decode()
        self.assertIn("Stock théorique", content)
        self.assertIn(";20;17;-3;", content)
