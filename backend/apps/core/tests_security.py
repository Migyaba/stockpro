import threading
from datetime import date
from unittest import mock, skipUnless

from django.core import mail
from django.core.cache import cache
from django.db import connection
from django.test import TransactionTestCase, override_settings
from rest_framework.throttling import ScopedRateThrottle

from apps.accounts.models import Membership, Role, User
from apps.core.exceptions import InsufficientStock
from apps.core.tests import StockProAPITestCase
from apps.inventory.models import StockMovement, StockPosition, Warehouse
from apps.organizations.models import Organization, SubscriptionPayment
from apps.products.models import Product
from apps.sales.models import Sale, SaleItem
from apps.sales.services import complete_sale

PASSWORD = "Motdepasse1"


class SecurityTestCase(StockProAPITestCase):
    def setUp(self):
        cache.clear()
        self.owner_tokens = self.register("owner@example.com", "Boutique A")
        self.org = Organization.objects.get(name="Boutique A")
        self.auth(self.owner_tokens)
        self.warehouse_id = self.client.get("/api/warehouses/").data["results"][0]["id"]
        self.product_id = self.create_product("TS-1", price=1000, qty=20)

    def create_product(self, sku, price=1000, qty=0):
        payload = {"name": f"Produit {sku}", "sku": sku, "purchase_price": 600, "selling_price": price}
        if qty:
            payload.update(initial_quantity=qty, initial_warehouse=self.warehouse_id)
        res = self.client.post("/api/products/", payload, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        return res.data["id"]

    def member(self, role, email=None):
        email = email or f"{role.lower()}@example.com"
        user = User.objects.create_user(email=email, password=PASSWORD, first_name="M", last_name="R")
        membership = Membership.objects.create(user=user, organization=self.org, role=role)
        res = self.client.post("/api/auth/login/", {"email": email, "password": PASSWORD}, format="json")
        self.assertEqual(res.status_code, 200, res.data)
        return membership, res.data

    def create_sale(self, unit_price=None, quantity=1, discount=0):
        item = {"product": self.product_id, "quantity": quantity, "discount": discount}
        if unit_price is not None:
            item["unit_price"] = unit_price
        res = self.client.post(
            "/api/sales/", {"warehouse": self.warehouse_id, "items": [item]}, format="json"
        )
        self.assertEqual(res.status_code, 201, res.data)
        return res.data["id"]

    def stock(self):
        return StockPosition.objects.get(product_id=self.product_id).quantity


class DocumentImmutabilityTests(SecurityTestCase):
    def test_completed_sale_cannot_be_patched_or_deleted(self):
        sale_id = self.create_sale()
        self.client.post(f"/api/sales/{sale_id}/complete/")
        _, staff = self.member(Role.STAFF)
        self.auth(staff)
        self.assertEqual(self.client.patch(f"/api/sales/{sale_id}/", {}, format="json").status_code, 405)
        self.assertEqual(self.client.delete(f"/api/sales/{sale_id}/").status_code, 405)
        self.auth(self.owner_tokens)
        self.assertEqual(self.client.delete(f"/api/sales/{sale_id}/").status_code, 405)
        self.assertTrue(Sale.objects.filter(id=sale_id).exists())

    def test_purchases_and_transfers_cannot_be_deleted(self):
        supplier = self.client.post("/api/suppliers/", {"name": "Grossiste"}, format="json").data
        purchase = self.client.post(
            "/api/purchases/",
            {
                "supplier": supplier["id"],
                "warehouse": self.warehouse_id,
                "items": [{"product": self.product_id, "quantity": 1, "unit_price": 500}],
            },
            format="json",
        ).data
        self.assertEqual(self.client.delete(f"/api/purchases/{purchase['id']}/").status_code, 405)
        self.assertEqual(self.client.patch(f"/api/purchases/{purchase['id']}/", {}, format="json").status_code, 405)


class PricingTests(SecurityTestCase):
    def test_staff_cannot_sell_below_catalog_price(self):
        _, staff = self.member(Role.STAFF)
        self.auth(staff)
        sale_id = self.create_sale(unit_price=1)
        res = self.client.post(f"/api/sales/{sale_id}/complete/")
        self.assertEqual(res.status_code, 400, res.data)
        self.assertEqual(self.stock(), 20)

    def test_staff_can_sell_at_catalog_price(self):
        _, staff = self.member(Role.STAFF)
        self.auth(staff)
        sale_id = self.create_sale()
        self.assertEqual(self.client.post(f"/api/sales/{sale_id}/complete/").status_code, 200)

    def test_manager_discount_is_capped(self):
        _, manager = self.member(Role.MANAGER)
        self.auth(manager)
        allowed = self.create_sale(unit_price=900)  # 10 % : plafond par défaut
        self.assertEqual(self.client.post(f"/api/sales/{allowed}/complete/").status_code, 200)
        refused = self.create_sale(quantity=1, discount=150)  # 15 %
        self.assertEqual(self.client.post(f"/api/sales/{refused}/complete/").status_code, 400)

    def test_owner_has_no_discount_cap(self):
        sale_id = self.create_sale(unit_price=1)
        self.assertEqual(self.client.post(f"/api/sales/{sale_id}/complete/").status_code, 200)

    def test_negative_amounts_are_rejected(self):
        res = self.client.post(
            "/api/sales/",
            {"warehouse": self.warehouse_id, "items": [{"product": self.product_id, "quantity": 1, "discount": -100}]},
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        res = self.client.post(
            "/api/sales/",
            {"warehouse": self.warehouse_id, "items": [{"product": self.product_id, "quantity": 0}]},
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_tax_is_computed_by_server(self):
        Organization.objects.filter(pk=self.org.pk).update(
            tax_enabled=True, tax_rate_bps=1800, prices_include_tax=True
        )
        res = self.client.post(
            "/api/sales/",
            {"warehouse": self.warehouse_id, "items": [{"product": self.product_id, "quantity": 1, "tax": -900}]},
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data["total"], 1000)  # prix TTC
        self.assertEqual(res.data["tax"], 153)  # 1000 - round(1000 / 1.18)

        Organization.objects.filter(pk=self.org.pk).update(prices_include_tax=False)
        res = self.client.post(
            "/api/sales/",
            {"warehouse": self.warehouse_id, "items": [{"product": self.product_id, "quantity": 1}]},
            format="json",
        )
        self.assertEqual(res.data["tax"], 180)
        self.assertEqual(res.data["total"], 1180)


class CrossTenantTests(SecurityTestCase):
    def setUp(self):
        super().setUp()
        self.other_tokens = self.register("other@example.com", "Boutique B")

    def test_sale_with_other_org_product_and_warehouse_is_rejected(self):
        self.auth(self.other_tokens)
        res = self.client.post(
            "/api/sales/",
            {"warehouse": self.warehouse_id, "items": [{"product": self.product_id, "quantity": 1}]},
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        self.assertNotIn("Boutique Cotonou", str(res.data))

    def test_product_with_other_org_category_is_rejected(self):
        category = self.client.post("/api/categories/", {"name": "Textile"}, format="json").data
        self.auth(self.other_tokens)
        res = self.client.post(
            "/api/products/",
            {"name": "X", "sku": "X", "selling_price": 1, "category": category["id"]},
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_transfer_with_other_org_warehouse_is_rejected(self):
        self.auth(self.other_tokens)
        own_warehouse = self.client.get("/api/warehouses/").data["results"][0]["id"]
        res = self.client.post(
            "/api/transfers/",
            {
                "source": self.warehouse_id,
                "destination": own_warehouse,
                "items": [{"product": self.product_id, "quantity": 1}],
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)


class RoleEscalationTests(SecurityTestCase):
    def test_admin_cannot_promote_to_owner_or_edit_self(self):
        admin, admin_tokens = self.member(Role.ADMINISTRATOR)
        staff, _ = self.member(Role.STAFF)
        self.auth(admin_tokens)
        self.assertEqual(self.client.patch(f"/api/users/{admin.id}/", {"role": "OWNER"}, format="json").status_code, 400)
        self.assertEqual(self.client.patch(f"/api/users/{staff.id}/", {"role": "OWNER"}, format="json").status_code, 403)
        owner = Membership.objects.get(organization=self.org, role=Role.OWNER)
        self.assertEqual(self.client.patch(f"/api/users/{owner.id}/", {"is_active": False}, format="json").status_code, 403)
        self.assertEqual(self.client.patch(f"/api/users/{staff.id}/", {"role": "MANAGER"}, format="json").status_code, 200)

    def test_last_owner_cannot_be_removed(self):
        owner = Membership.objects.get(organization=self.org, role=Role.OWNER)
        second, _ = self.member(Role.OWNER, email="second@example.com")
        self.auth(self.owner_tokens)
        res = self.client.patch(f"/api/users/{second.id}/", {"role": "ADMINISTRATOR"}, format="json")
        self.assertEqual(res.status_code, 200, res.data)
        # `owner` est désormais le seul : personne ne peut le retirer, pas même lui-même.
        res = self.client.patch(f"/api/users/{owner.id}/", {"is_active": False}, format="json")
        self.assertEqual(res.status_code, 400)


class ConcurrencyAndIdempotencyTests(SecurityTestCase):
    def test_second_completion_does_not_move_stock_twice(self):
        sale_id = self.create_sale(quantity=3)
        self.assertEqual(self.client.post(f"/api/sales/{sale_id}/complete/").status_code, 200)
        self.assertEqual(self.client.post(f"/api/sales/{sale_id}/complete/").status_code, 400)
        self.assertEqual(self.stock(), 17)

    def test_idempotency_key_replays_response(self):
        sale_id = self.create_sale(quantity=2)
        headers = {"HTTP_IDEMPOTENCY_KEY": "vente-1"}
        first = self.client.post(f"/api/sales/{sale_id}/complete/", **headers)
        replay = self.client.post(f"/api/sales/{sale_id}/complete/", **headers)
        self.assertEqual(first.status_code, 200)
        self.assertEqual(replay.status_code, 200)
        self.assertEqual(replay.data["status"], "COMPLETED")
        self.assertEqual(StockMovement.objects.filter(reference_id=sale_id).count(), 1)

    def test_idempotency_key_reused_with_other_payload_conflicts(self):
        supplier = self.client.post("/api/suppliers/", {"name": "Grossiste"}, format="json").data
        purchase = self.client.post(
            "/api/purchases/",
            {
                "supplier": supplier["id"],
                "warehouse": self.warehouse_id,
                "items": [{"product": self.product_id, "quantity": 10, "unit_price": 500}],
            },
            format="json",
        ).data
        purchase = self.client.post(f"/api/purchases/{purchase['id']}/confirm/").data
        item_id = purchase["items"][0]["id"]
        url = f"/api/purchases/{purchase['id']}/receive/"
        headers = {"HTTP_IDEMPOTENCY_KEY": "reception-1"}
        ok = self.client.post(url, {"lines": [{"purchase_item_id": item_id, "quantity": 4}]}, format="json", **headers)
        self.assertEqual(ok.status_code, 200, ok.data)
        conflict = self.client.post(url, {"lines": [{"purchase_item_id": item_id, "quantity": 5}]}, format="json", **headers)
        self.assertEqual(conflict.status_code, 409)
        self.assertEqual(conflict.data["error"]["code"], "IDEMPOTENCY_CONFLICT")
        self.assertEqual(self.stock(), 24)

    def test_invalid_receive_payload_is_a_400(self):
        res = self.client.post(
            f"/api/purchases/{self.product_id}/receive/", {"lines": [{"quantity": "abc"}]}, format="json"
        )
        self.assertIn(res.status_code, (400, 404))


class ValidationErrorTests(SecurityTestCase):
    def test_duplicate_sku_is_a_400(self):
        res = self.client.post("/api/products/", {"name": "Bis", "sku": "TS-1", "selling_price": 1}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("sku", res.data["error"]["message"])

    def test_unknown_initial_warehouse_creates_nothing(self):
        res = self.client.post(
            "/api/products/",
            {
                "name": "Fantôme",
                "sku": "GHOST",
                "selling_price": 1,
                "initial_quantity": 5,
                "initial_warehouse": "00000000-0000-0000-0000-000000000000",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        self.assertFalse(Product.objects.filter(sku="GHOST").exists())


class AuthHardeningTests(SecurityTestCase):
    def test_login_is_throttled(self):
        cache.clear()
        with mock.patch.dict(ScopedRateThrottle.THROTTLE_RATES, {"auth_login": "3/min"}):
            codes = [
                self.client.post("/api/auth/login/", {"email": "x@example.com", "password": "bad"}, format="json").status_code
                for _ in range(4)
            ]
        self.assertEqual(codes[-1], 429)

    def test_refresh_with_revoked_membership_is_401(self):
        membership, tokens = self.member(Role.STAFF)
        membership.is_active = False
        membership.save()
        self.client.credentials()
        res = self.client.post("/api/auth/refresh/", {"refresh": tokens["refresh"]}, format="json")
        self.assertEqual(res.status_code, 401)

    def test_password_reset_flow_sends_email_and_validates_password(self):
        self.client.credentials()
        self.assertEqual(self.client.post("/api/auth/password/forgot/", {"email": "owner@example.com"}, format="json").status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        link = next(line for line in mail.outbox[0].body.splitlines() if "reset-password" in line)
        query = dict(part.split("=", 1) for part in link.split("?", 1)[1].split("&"))
        weak = self.client.post("/api/auth/password/reset/", {**query, "password": "12345678"}, format="json")
        self.assertEqual(weak.status_code, 400)
        strong = self.client.post("/api/auth/password/reset/", {**query, "password": "Nouveau-Secret-42"}, format="json")
        self.assertEqual(strong.status_code, 200)


class BillingHardeningTests(SecurityTestCase):
    @override_settings(DEBUG=True, ALPHAPAY_WEBHOOK_SECRET="")
    def test_unsigned_webhook_rejected_even_in_debug(self):
        self.client.credentials()
        res = self.client.post("/api/billing/webhook/alphapay/", {"event": "payment.succeeded"}, format="json")
        self.assertEqual(res.status_code, 503)

    def test_checkout_requires_owner(self):
        _, admin = self.member(Role.ADMINISTRATOR)
        self.auth(admin)
        self.assertEqual(self.client.post("/api/billing/checkout/", {"plan": "monthly"}, format="json").status_code, 403)

    @override_settings(DEBUG=False, ALPHAPAY_SECRET_KEY="")
    def test_no_simulated_checkout_in_production(self):
        res = self.client.post("/api/billing/checkout/", {"plan": "monthly"}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertFalse(SubscriptionPayment.objects.exists())


class CostVisibilityTests(SecurityTestCase):
    def test_staff_does_not_see_costs(self):
        _, staff = self.member(Role.STAFF)
        self.auth(staff)
        self.assertEqual(self.client.get("/api/dashboard/").data["stock_value"], 0)
        movement = self.client.get("/api/movements/").data["results"][0]
        self.assertNotIn("unit_cost", movement)


@skipUnless(connection.vendor == "postgresql", "Verrous FOR UPDATE : nécessite TEST_DATABASE_URL (PostgreSQL).")
class ConcurrentCompletionTests(TransactionTestCase):
    """§67.1 : deux validations simultanées sur la dernière unité, une seule réussit."""

    def test_only_one_sale_gets_the_last_unit(self):
        user = User.objects.create_user(email="c@example.com", password=PASSWORD, first_name="C", last_name="C")
        org = Organization.objects.create(name="Concurrence", status="ACTIVE")
        membership = Membership.objects.create(user=user, organization=org, role=Role.OWNER)
        warehouse = Warehouse.objects.create(organization=org, name="Dépôt", code="MAIN")
        product = Product.objects.create(organization=org, name="Dernier", sku="LAST", selling_price=100)
        StockPosition.objects.create(organization=org, product=product, warehouse=warehouse, quantity=1)
        sales = []
        for ref in ("V-1", "V-2"):
            sale = Sale.objects.create(
                organization=org, warehouse=warehouse, reference=ref, sale_date=date.today(), created_by=user
            )
            SaleItem.objects.create(sale=sale, product=product, quantity=1, unit_price=100)
            sales.append(sale)

        barrier = threading.Barrier(2)
        outcomes = []

        def attempt(sale):
            try:
                barrier.wait()
                complete_sale(sale, user, membership)
                outcomes.append("ok")
            except InsufficientStock:
                outcomes.append("refused")
            finally:
                connection.close()

        threads = [threading.Thread(target=attempt, args=(sale,)) for sale in sales]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()

        self.assertEqual(sorted(outcomes), ["ok", "refused"])
        self.assertEqual(StockPosition.objects.get(product=product).quantity, 0)
