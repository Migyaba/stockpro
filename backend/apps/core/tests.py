from rest_framework import status
from rest_framework.test import APITestCase

from apps.inventory.models import StockPosition


class StockProAPITestCase(APITestCase):
    def register(self, email, org_name, password="Motdepasse1"):
        res = self.client.post(
            "/api/auth/register/",
            {
                "email": email,
                "password": password,
                "first_name": "Marie",
                "last_name": "Test",
                "organization_name": org_name,
                "warehouse_name": "Boutique Cotonou",
                "country": "BJ",
                "currency": "XOF",
                "timezone": "Africa/Porto-Novo",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        return res.data

    def auth(self, tokens):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")


class IsolationTests(StockProAPITestCase):
    def test_org_a_cannot_read_org_b_product(self):
        a = self.register("a@example.com", "Boutique A")
        self.auth(a)
        created = self.client.post(
            "/api/products/",
            {
                "name": "Riz 25kg",
                "sku": "RIZ-25",
                "purchase_price": 8000,
                "selling_price": 10000,
            },
            format="json",
        )
        self.assertEqual(created.status_code, 201, created.data)
        product_id = created.data["id"]

        b = self.register("b@example.com", "Boutique B")
        self.auth(b)
        hidden = self.client.get(f"/api/products/{product_id}/")
        self.assertEqual(hidden.status_code, 404)

        listed = self.client.get("/api/products/")
        self.assertEqual(listed.data["count"], 0)


class SaleStockTests(StockProAPITestCase):
    def setUp(self):
        data = self.register("owner@example.com", "Élégance")
        self.auth(data)
        warehouses = self.client.get("/api/warehouses/").data["results"]
        self.warehouse_id = warehouses[0]["id"]
        product = self.client.post(
            "/api/products/",
            {
                "name": "T-shirt noir",
                "sku": "TS-NOIR",
                "purchase_price": 4000,
                "selling_price": 7000,
                "minimum_stock": 2,
                "initial_quantity": 10,
                "initial_warehouse": self.warehouse_id,
            },
            format="json",
        )
        self.assertEqual(product.status_code, 201, product.data)
        self.product_id = product.data["id"]

    def test_completed_sale_decreases_stock(self):
        sale = self.client.post(
            "/api/sales/",
            {
                "warehouse": self.warehouse_id,
                "items": [{"product": self.product_id, "quantity": 3}],
            },
            format="json",
        )
        self.assertEqual(sale.status_code, 201, sale.data)
        done = self.client.post(f"/api/sales/{sale.data['id']}/complete/")
        self.assertEqual(done.status_code, 200, done.data)
        self.assertEqual(done.data["status"], "COMPLETED")
        pos = StockPosition.objects.get(product_id=self.product_id)
        self.assertEqual(pos.quantity, 7)

    def test_insufficient_stock_is_rejected(self):
        sale = self.client.post(
            "/api/sales/",
            {
                "warehouse": self.warehouse_id,
                "items": [{"product": self.product_id, "quantity": 50}],
            },
            format="json",
        )
        self.assertEqual(sale.status_code, 201, sale.data)
        done = self.client.post(f"/api/sales/{sale.data['id']}/complete/")
        self.assertEqual(done.status_code, 400)
        self.assertEqual(done.data["error"]["code"], "STOCK_INSUFFICIENT")
        pos = StockPosition.objects.get(product_id=self.product_id)
        self.assertEqual(pos.quantity, 10)

    def test_partial_purchase_receipt_increases_stock(self):
        supplier = self.client.post(
            "/api/suppliers/", {"name": "Grossiste Cotonou"}, format="json"
        )
        self.assertEqual(supplier.status_code, 201, supplier.data)
        purchase = self.client.post(
            "/api/purchases/",
            {
                "supplier": supplier.data["id"],
                "warehouse": self.warehouse_id,
                "items": [
                    {
                        "product": self.product_id,
                        "quantity": 100,
                        "unit_price": 4000,
                    }
                ],
            },
            format="json",
        )
        self.assertEqual(purchase.status_code, 201, purchase.data)
        confirmed = self.client.post(f"/api/purchases/{purchase.data['id']}/confirm/")
        self.assertEqual(confirmed.status_code, 200, confirmed.data)
        item_id = confirmed.data["items"][0]["id"]
        received = self.client.post(
            f"/api/purchases/{purchase.data['id']}/receive/",
            {"lines": [{"purchase_item_id": item_id, "quantity": 40}]},
            format="json",
        )
        self.assertEqual(received.status_code, 200, received.data)
        self.assertEqual(received.data["status"], "PARTIALLY_RECEIVED")
        pos = StockPosition.objects.get(product_id=self.product_id)
        self.assertEqual(pos.quantity, 50)


class TrialAndBillingTests(StockProAPITestCase):
    def test_new_org_gets_7_day_trial_with_access(self):
        from datetime import timedelta

        from django.utils import timezone

        from apps.organizations.models import Organization

        self.auth(self.register("trial@example.com", "Essai SARL"))
        org = Organization.objects.get(name="Essai SARL")
        self.assertEqual(org.status, "TRIAL")
        remaining = org.trial_ends_at - timezone.now()
        self.assertAlmostEqual(remaining, timedelta(days=7), delta=timedelta(minutes=1))
        self.assertEqual(self.client.get("/api/products/").status_code, 200)

    def test_expired_trial_blocks_operations_but_not_billing(self):
        from datetime import timedelta

        from django.utils import timezone

        from apps.organizations.models import Organization

        self.auth(self.register("exp@example.com", "Expire SARL"))
        Organization.objects.filter(name="Expire SARL").update(
            trial_ends_at=timezone.now() - timedelta(minutes=1)
        )
        self.assertEqual(self.client.get("/api/products/").status_code, 403)
        sub = self.client.get("/api/billing/subscription/")
        self.assertEqual(sub.status_code, 200, sub.data)
        self.assertFalse(sub.data["has_active_access"])

    def test_payment_activation_is_idempotent(self):
        from apps.organizations.billing import activate_subscription_from_payment
        from apps.organizations.models import Organization, SubscriptionPayment

        self.register("pay@example.com", "Pay SARL")
        org = Organization.objects.get(name="Pay SARL")
        payment = SubscriptionPayment.objects.create(
            organization=org, reference="SUB-TEST", plan="MONTHLY", amount=5000
        )
        activate_subscription_from_payment(payment)
        org.refresh_from_db()
        first_end = org.subscription_ends_at
        activate_subscription_from_payment(SubscriptionPayment.objects.get(pk=payment.pk))
        org.refresh_from_db()
        self.assertEqual(org.subscription_ends_at, first_end)
        self.assertEqual(org.status, "ACTIVE")

    def test_webhook_rejected_without_secret(self):
        res = self.client.post(
            "/api/billing/webhook/alphapay/", {"event": "payment.succeeded"}, format="json"
        )
        self.assertEqual(res.status_code, 503)
