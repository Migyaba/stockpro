from apps.accounts.models import Role
from apps.audit.models import AuditLog
from apps.core.tests_security import SecurityTestCase
from apps.notifications.models import Notification


class StockAlertTests(SecurityTestCase):
    """Produit TS-1 : 20 en stock ; on lui fixe un seuil de 5."""

    def setUp(self):
        super().setUp()
        self.client.patch(f"/api/products/{self.product_id}/", {"minimum_stock": 5}, format="json")

    def sell(self, quantity):
        sale = self.create_sale(quantity=quantity)
        res = self.client.post(f"/api/sales/{sale}/complete/")
        self.assertEqual(res.status_code, 200, res.data)

    def test_alert_list_and_summary(self):
        # Un second produit, en stock puis épuisé : rupture.
        empty_id = self.create_product("VIDE", qty=2)
        sale = self.client.post(
            "/api/sales/",
            {"warehouse": self.warehouse_id, "items": [{"product": empty_id, "quantity": 2}]},
            format="json",
        ).data["id"]
        self.client.post(f"/api/sales/{sale}/complete/")
        self.sell(16)  # reste 4 ≤ 5
        res = self.client.get("/api/alerts/stock/")
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(res.data["summary"], {"out": 1, "low": 1})
        kinds = [a["kind"] for a in res.data["results"]]
        self.assertEqual(kinds, ["out", "low"])
        self.assertEqual(self.client.get("/api/alerts/stock/", {"kind": "low"}).data["count"], 1)

    def test_threshold_crossing_notifies_once(self):
        manager, manager_tokens = self.member(Role.MANAGER)
        _, staff_tokens = self.member(Role.STAFF)
        self.sell(10)  # 10 restants : au-dessus du seuil
        self.assertFalse(Notification.objects.exists())
        self.sell(6)  # 4 restants : franchissement
        self.sell(1)  # déjà sous le seuil : pas de nouvelle alerte
        low = Notification.objects.filter(kind="STOCK_LOW")
        # Owner + manager (peuvent réapprovisionner), pas le vendeur.
        self.assertEqual(low.count(), 2)
        self.assertTrue(low.filter(recipient=manager).exists())
        self.sell(3)  # épuisé
        self.assertEqual(Notification.objects.filter(kind="STOCK_OUT").count(), 2)

        self.auth(staff_tokens)
        self.assertEqual(self.client.get("/api/notifications/unread-count/").data["count"], 0)
        self.auth(manager_tokens)
        self.assertEqual(self.client.get("/api/notifications/unread-count/").data["count"], 2)
        self.assertEqual(self.client.post("/api/notifications/read-all/").data["updated"], 2)
        self.assertEqual(self.client.get("/api/notifications/", {"unread": "1"}).data["count"], 0)

    def test_inventory_review_notifies_validators_but_not_author(self):
        _, staff_tokens = self.member(Role.STAFF)
        inv = self.client.post("/api/inventories/", {"warehouse": self.warehouse_id}, format="json").data["id"]
        self.client.post(f"/api/inventories/{inv}/start/")
        self.auth(staff_tokens)
        self.client.post(f"/api/inventories/{inv}/lines/", {"lines": [{"code": "TS-1", "add": 1}]}, format="json")
        self.client.post(f"/api/inventories/{inv}/review/")
        notes = Notification.objects.filter(kind="INVENTORY_REVIEW")
        self.assertEqual(notes.count(), 1)
        self.assertEqual(notes.get().recipient.role, Role.OWNER)

    def test_notifications_are_private(self):
        self.sell(16)
        note = Notification.objects.first()
        _, other_tokens = self.member(Role.MANAGER, email="autre@example.com")
        self.auth(other_tokens)
        self.assertEqual(self.client.post(f"/api/notifications/{note.id}/read/").status_code, 404)


class AuditTrailTests(SecurityTestCase):
    def test_price_change_keeps_old_and_new_values(self):
        self.client.patch(f"/api/products/{self.product_id}/", {"selling_price": 1200, "name": "Produit TS-1"}, format="json")
        log = AuditLog.objects.get(action="UPDATE", entity_id=self.product_id)
        # Seul le prix a changé : le nom identique n'est pas journalisé.
        self.assertEqual(log.old_values, {"selling_price": 1000})
        self.assertEqual(log.new_values, {"selling_price": 1200})
        self.assertEqual(log.entity_label, "Produit TS-1")

    def test_deactivation_and_member_rights_are_logged(self):
        self.client.delete(f"/api/products/{self.product_id}/")
        self.assertTrue(
            AuditLog.objects.filter(entity_id=self.product_id, new_values={"is_active": False}).exists()
        )
        staff, _ = self.member(Role.STAFF)
        self.client.patch(f"/api/users/{staff.id}/", {"role": "MANAGER", "warehouse_ids": [self.warehouse_id]}, format="json")
        logs = AuditLog.objects.filter(entity_id=str(staff.id))
        self.assertTrue(logs.filter(new_values={"role": "MANAGER"}).exists())
        self.assertTrue(logs.filter(new_values={"warehouse_ids": [self.warehouse_id]}).exists())

    def test_org_settings_change_is_logged(self):
        self.client.patch("/api/organizations/me/", {"tax_enabled": True, "tax_rate_bps": 1800}, format="json")
        log = AuditLog.objects.get(entity_type="Organization", action="UPDATE")
        self.assertEqual(log.new_values, {"tax_enabled": True, "tax_rate_bps": 1800})

    def test_failed_operation_leaves_no_audit(self):
        sale = self.create_sale(quantity=500)
        self.assertEqual(self.client.post(f"/api/sales/{sale}/complete/").status_code, 400)
        self.assertFalse(AuditLog.objects.filter(action="VALIDATE", entity_id=sale).exists())

    def test_audit_api_is_restricted_and_filterable(self):
        self.client.patch(f"/api/products/{self.product_id}/", {"selling_price": 1500}, format="json")
        res = self.client.get("/api/audit/", {"action": "UPDATE"})
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(res.data["results"][0]["action_label"], "A modifié")
        self.assertEqual(res.data["results"][0]["user_name"], "Marie Test")
        _, manager = self.member(Role.MANAGER)
        self.auth(manager)
        self.assertEqual(self.client.get("/api/audit/").status_code, 403)
