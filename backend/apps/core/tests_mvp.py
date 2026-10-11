from urllib.parse import parse_qs, urlparse

from django.core import mail

from apps.accounts.models import Membership, MembershipWarehouse, Role
from apps.core.tests_security import PASSWORD, SecurityTestCase


class InvitationFlowTests(SecurityTestCase):
    def invite(self, email, role="STAFF", warehouse_ids=()):
        res = self.client.post(
            "/api/invitations/",
            {"email": email, "role": role, "warehouse_ids": list(warehouse_ids)},
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.data)
        return parse_qs(urlparse(res.data["invitation_url"]).query)["token"][0]

    def test_new_user_accepts_and_gets_warehouses(self):
        token = self.invite("vendeur@example.com", warehouse_ids=[self.warehouse_id])
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(token, mail.outbox[0].body)
        self.client.credentials()
        info = self.client.get("/api/auth/invitations/info/", {"token": token})
        self.assertEqual(info.status_code, 200, info.data)
        self.assertFalse(info.data["account_exists"])
        self.assertEqual(info.data["organization_name"], "Boutique A")
        res = self.client.post(
            "/api/auth/invitations/accept/",
            {"token": token, "password": "Vendeur-Secret-1", "first_name": "Awa", "last_name": "K"},
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.data)
        membership = Membership.objects.get(user__email="vendeur@example.com")
        self.assertEqual(membership.role, Role.STAFF)
        self.assertEqual([str(i) for i in membership.warehouse_ids()], [self.warehouse_id])
        replay = self.client.post(
            "/api/auth/invitations/accept/",
            {"token": token, "password": "Vendeur-Secret-1", "first_name": "A", "last_name": "K"},
            format="json",
        )
        self.assertEqual(replay.status_code, 400)

    def test_existing_account_must_prove_password(self):
        self.register("ailleurs@example.com", "Autre Boutique")
        self.auth(self.owner_tokens)
        token = self.invite("ailleurs@example.com", role="MANAGER")
        self.client.credentials()
        wrong = self.client.post(
            "/api/auth/invitations/accept/", {"token": token, "password": "mauvais"}, format="json"
        )
        self.assertEqual(wrong.status_code, 400)
        self.assertFalse(Membership.objects.filter(user__email="ailleurs@example.com", organization=self.org).exists())
        ok = self.client.post(
            "/api/auth/invitations/accept/", {"token": token, "password": PASSWORD}, format="json"
        )
        self.assertEqual(ok.status_code, 200, ok.data)

        # Deux organisations : le login demande de choisir.
        login = self.client.post(
            "/api/auth/login/", {"email": "ailleurs@example.com", "password": PASSWORD}, format="json"
        )
        self.assertEqual(login.status_code, 400)
        self.assertEqual(login.data["error"]["code"], "ORGANIZATION_REQUIRED")
        organizations = login.data["error"]["details"]["organizations"]
        self.assertEqual(len(organizations), 2)
        chosen = self.client.post(
            "/api/auth/login/",
            {"email": "ailleurs@example.com", "password": PASSWORD, "organization_id": str(self.org.id)},
            format="json",
        )
        self.assertEqual(chosen.status_code, 200, chosen.data)

    def test_pending_invitation_can_be_revoked(self):
        token = self.invite("annule@example.com")
        invitation_id = self.client.get("/api/invitations/", {"status": "pending"}).data["results"][0]["id"]
        self.assertEqual(self.client.delete(f"/api/invitations/{invitation_id}/").status_code, 204)
        self.client.credentials()
        self.assertEqual(self.client.get("/api/auth/invitations/info/", {"token": token}).status_code, 400)

    def test_staff_cannot_invite(self):
        _, staff = self.member(Role.STAFF)
        self.auth(staff)
        res = self.client.post("/api/invitations/", {"email": "x@example.com", "role": "STAFF"}, format="json")
        self.assertEqual(res.status_code, 403)


class MemberWarehouseTests(SecurityTestCase):
    def test_owner_restricts_member_to_warehouses(self):
        staff, staff_tokens = self.member(Role.STAFF)
        other = self.client.post("/api/warehouses/", {"name": "Annexe", "code": "ANX"}, format="json").data
        res = self.client.patch(f"/api/users/{staff.id}/", {"warehouse_ids": [other["id"]]}, format="json")
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(res.data["warehouse_ids"], [other["id"]])
        self.auth(staff_tokens)
        visible = [w["id"] for w in self.client.get("/api/warehouses/").data["results"]]
        self.assertEqual(visible, [other["id"]])
        # Retour à « tous les dépôts ».
        self.auth(self.owner_tokens)
        self.client.patch(f"/api/users/{staff.id}/", {"warehouse_ids": []}, format="json")
        self.assertFalse(MembershipWarehouse.objects.filter(membership=staff).exists())


class CatalogTests(SecurityTestCase):
    def test_product_exposes_total_stock(self):
        product = self.client.get(f"/api/products/{self.product_id}/").data
        self.assertEqual(product["total_stock"], 20)

    def test_inactive_product_rejected_in_purchase_and_transfer(self):
        self.client.delete(f"/api/products/{self.product_id}/")
        supplier = self.client.post("/api/suppliers/", {"name": "Grossiste"}, format="json").data
        purchase = self.client.post(
            "/api/purchases/",
            {
                "supplier": supplier["id"],
                "warehouse": self.warehouse_id,
                "items": [{"product": self.product_id, "quantity": 1, "unit_price": 10}],
            },
            format="json",
        )
        self.assertEqual(purchase.status_code, 400)
        other = self.client.post("/api/warehouses/", {"name": "Annexe", "code": "ANX"}, format="json").data
        transfer = self.client.post(
            "/api/transfers/",
            {
                "source": self.warehouse_id,
                "destination": other["id"],
                "items": [{"product": self.product_id, "quantity": 1}],
            },
            format="json",
        )
        self.assertEqual(transfer.status_code, 400)

    def test_transfer_moves_stock_between_warehouses(self):
        other = self.client.post("/api/warehouses/", {"name": "Annexe", "code": "ANX"}, format="json").data
        transfer = self.client.post(
            "/api/transfers/",
            {
                "source": self.warehouse_id,
                "destination": other["id"],
                "items": [{"product": self.product_id, "quantity": 5}],
            },
            format="json",
        ).data
        done = self.client.post(f"/api/transfers/{transfer['id']}/complete/")
        self.assertEqual(done.status_code, 200, done.data)
        self.assertEqual(self.client.get(f"/api/products/{self.product_id}/").data["total_stock"], 20)
        positions = {
            p["warehouse"]["id"]: p["quantity"]
            for p in self.client.get("/api/stock/", {"product": self.product_id}).data["results"]
        }
        self.assertEqual(positions, {self.warehouse_id: 15, other["id"]: 5})
