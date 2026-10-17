from django.conf import settings
from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.db import transaction

from apps.accounts.models import Role, User
from apps.core.tests import StockProAPITestCase
from apps.organizations.models import Organization
from apps.audit.models import AuditLog
from apps.core.tests_security import SecurityTestCase
from apps.notifications.models import Notification, NotificationKind
from apps.notifications.services import notify


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
        self.assertEqual(res.data["summary"], {"out": 1, "low": 1, "total": 2})
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


class NotificationEmailTests(SecurityTestCase):
    def setUp(self):
        super().setUp()
        self.client.patch(f"/api/products/{self.product_id}/", {"minimum_stock": 5}, format="json")
        mail.outbox.clear()

    def sell(self, quantity):
        sale = self.create_sale(quantity=quantity)
        with self.captureOnCommitCallbacks(execute=True):
            res = self.client.post(f"/api/sales/{sale}/complete/")
        self.assertEqual(res.status_code, 200, res.data)

    def test_stock_alert_is_emailed_to_recipients(self):
        self.member(Role.MANAGER)
        self.member(Role.STAFF)
        self.sell(16)
        self.assertEqual(sorted(m.to[0] for m in mail.outbox), ["manager@example.com", "owner@example.com"])
        message = mail.outbox[0]
        self.assertEqual(message.subject, "Stock faible · Boutique A")
        self.assertIn("Produit TS-1", message.body)
        self.assertIn("/stock/alertes", message.body)
        self.assertIn("/stock/alertes", message.alternatives[0][0])

    def test_preferences_are_respected(self):
        _, manager_tokens = self.member(Role.MANAGER)
        self.auth(manager_tokens)
        res = self.client.patch(
            "/api/notifications/preferences/", {"email": {"STOCK_LOW": False}}, format="json"
        )
        self.assertEqual(res.status_code, 200, res.data)
        prefs = {k["kind"]: k["email"] for k in res.data["kinds"]}
        self.assertFalse(prefs["STOCK_LOW"])
        self.assertTrue(prefs["STOCK_OUT"])
        self.auth(self.owner_tokens)
        self.sell(16)
        self.assertEqual([m.to[0] for m in mail.outbox], ["owner@example.com"])
        # La notification interne, elle, reste.
        self.assertEqual(Notification.objects.filter(kind="STOCK_LOW").count(), 2)

    def test_informative_kinds_are_off_by_default_and_opt_in(self):
        prefs = {k["kind"]: k["email"] for k in self.client.get("/api/notifications/preferences/").data["kinds"]}
        self.assertEqual(
            prefs,
            {"STOCK_LOW": True, "STOCK_OUT": True, "PURCHASE_RECEIVED": False,
             "TRANSFER_COMPLETED": False, "INVENTORY_REVIEW": True},
        )
        self.client.patch("/api/notifications/preferences/", {"email": {"TRANSFER_COMPLETED": True}}, format="json")
        with self.captureOnCommitCallbacks(execute=True):
            notify(self.org, kind=NotificationKind.TRANSFER_COMPLETED, message="Transfert validé.", link="/stock/transferts")
        self.assertEqual(len(mail.outbox), 1)

    def test_preferences_list_only_receivable_kinds_and_reject_others(self):
        _, staff_tokens = self.member(Role.STAFF)
        self.auth(staff_tokens)
        kinds = [k["kind"] for k in self.client.get("/api/notifications/preferences/").data["kinds"]]
        self.assertNotIn("STOCK_LOW", kinds)
        for payload in ({"STOCK_LOW": True}, {"STOCK_OUT": "oui"}, ["STOCK_OUT"]):
            res = self.client.patch("/api/notifications/preferences/", {"email": payload}, format="json")
            self.assertEqual(res.status_code, 400, payload)

    def test_unverified_or_inactive_members_get_no_email(self):
        unverified, _ = self.member(Role.MANAGER)
        unverified.user.email_verified_at = None
        unverified.user.save()
        inactive, _ = self.member(Role.MANAGER, email="inactive@example.com")
        inactive.is_active = False
        inactive.save()
        self.sell(16)
        self.assertEqual([m.to[0] for m in mail.outbox], ["owner@example.com"])

    def test_rolled_back_operation_sends_nothing(self):
        with self.captureOnCommitCallbacks(execute=True):
            try:
                with transaction.atomic():
                    notify(self.org, kind=NotificationKind.STOCK_OUT, message="Rupture.")
                    raise RuntimeError
            except RuntimeError:
                pass
        self.assertEqual(mail.outbox, [])


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


class StockLevelConsistencyTests(SecurityTestCase):
    """Une seule règle partout : rupture = 0, faible = 0 < qté ≤ seuil, sinon normal."""

    def test_status_field_filter_and_alerts_agree(self):
        # TS-1 : 20 en stock. Seuil 10 → normal (même si < 2 × seuil).
        self.client.patch(f"/api/products/{self.product_id}/", {"minimum_stock": 10}, format="json")
        position = self.client.get("/api/stock/", {"product": self.product_id}).data["results"][0]
        self.assertEqual(position["status"], "NORMAL")
        self.assertEqual(self.client.get("/api/stock/", {"status": "LOW"}).data["count"], 0)
        # Seuil 20 → faible, partout.
        self.client.patch(f"/api/products/{self.product_id}/", {"minimum_stock": 20}, format="json")
        position = self.client.get("/api/stock/", {"product": self.product_id}).data["results"][0]
        self.assertEqual(position["status"], "LOW")
        self.assertEqual(self.client.get("/api/stock/", {"status": "LOW"}).data["count"], 1)
        self.assertEqual(self.client.get("/api/alerts/stock/").data["summary"]["low"], 1)
        self.assertEqual(self.client.get("/api/dashboard/").data["low_stock_count"], 1)
        self.assertEqual(self.client.get("/api/stock/", {"status": "NORMAL"}).data["count"], 0)


class SignupAlertTests(StockProAPITestCase):
    payload = {
        "email": "nouveau@example.com",
        "password": "Motdepasse-solide-42",
        "first_name": "Awa",
        "last_name": "K",
        "phone": "+22990000000",
        "organization_name": "Boutique Nouvelle",
    }

    def setUp(self):
        cache.clear()

    def signup(self):
        res = self.client.post("/api/auth/register/", self.payload, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        return [m for m in mail.outbox if m.subject.startswith("Nouvelle inscription")]

    def test_superusers_are_alerted_by_default(self):
        User.objects.create_superuser(email="root@stockpro.test", password="x" * 12)
        User.objects.create_superuser(email="ancien@stockpro.test", password="x" * 12, is_active=False)
        alerts = self.signup()
        self.assertEqual([m.to for m in alerts], [["root@stockpro.test"]])
        alert = alerts[0]
        self.assertEqual(alert.subject, "Nouvelle inscription · Boutique Nouvelle")
        self.assertIn("Awa K · nouveau@example.com", alert.body)
        self.assertIn("+22990000000", alert.body)
        org = Organization.objects.get(name="Boutique Nouvelle")
        self.assertIn(f"/{settings.ADMIN_URL}organizations/organization/{org.pk}/change/", alert.body)

    @override_settings(SIGNUP_ALERT_EMAILS=["equipe@stockpro.test", "ventes@stockpro.test"])
    def test_configured_addresses_replace_superusers(self):
        User.objects.create_superuser(email="root@stockpro.test", password="x" * 12)
        alerts = self.signup()
        self.assertEqual(len(alerts), 2)
        self.assertEqual(sorted(m.to[0] for m in alerts), ["equipe@stockpro.test", "ventes@stockpro.test"])

    @override_settings(SIGNUP_ALERT_EMAILS=["off"])
    def test_alert_can_be_disabled(self):
        User.objects.create_superuser(email="root@stockpro.test", password="x" * 12)
        self.assertEqual(self.signup(), [])
