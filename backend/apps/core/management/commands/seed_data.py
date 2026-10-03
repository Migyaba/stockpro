import datetime
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import Membership, Role
from apps.customers.models import Customer
from apps.inventory.models import MovementType, StockMovement, StockPosition, Warehouse
from apps.organizations.models import Organization, OrganizationStatus
from apps.products.models import Category, Product
from apps.purchases.models import Purchase, PurchaseItem, PurchaseStatus
from apps.sales.models import Sale, SaleItem, SaleStatus
from apps.suppliers.models import Supplier

User = get_user_model()


class Command(BaseCommand):
    help = "Peuple la base de données avec des données de démonstration réalistes pour STOCKPRO."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Début du peuplement de la base de données STOCKPRO..."))

        with transaction.atomic():
            # 1. Organisation
            org, created = Organization.objects.get_or_create(
                slug="socomaf-benin",
                defaults={
                    "name": "SOCOMAF Distribution Bénin",
                    "currency": "XOF",
                    "currency_exponent": 0,
                    "country": "BJ",
                    "timezone": "Africa/Porto-Novo",
                    "tax_enabled": True,
                    "tax_rate_bps": 1800,
                    "prices_include_tax": True,
                    "address": "Zone Portuaire, Akpakpa",
                    "phone": "+229 21 33 44 55",
                    "email": "contact@socomaf.bj",
                    "status": OrganizationStatus.ACTIVE,
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"✓ Organisation créée : {org.name}"))
            else:
                self.stdout.write(f"• Organisation existante : {org.name}")

            # 2. Utilisateurs & Membres
            users_data = [
                {
                    "email": "admin@stockpro.test",
                    "first_name": "Miguel",
                    "last_name": "Misse",
                    "role": Role.OWNER,
                    "phone": "+229 97 00 11 22",
                    "is_staff": True,
                    "is_superuser": True,
                },
                {
                    "email": "manager@stockpro.test",
                    "first_name": "Alain",
                    "last_name": "Gbaguidi",
                    "role": Role.MANAGER,
                    "phone": "+229 96 33 44 55",
                    "is_staff": False,
                    "is_superuser": False,
                },
                {
                    "email": "cashier@stockpro.test",
                    "first_name": "Mireille",
                    "last_name": "Houessou",
                    "role": Role.STAFF,
                    "phone": "+229 95 66 77 88",
                    "is_staff": False,
                    "is_superuser": False,
                },
            ]

            created_users = {}
            for udata in users_data:
                user, u_created = User.objects.get_or_create(
                    email=udata["email"],
                    defaults={
                        "first_name": udata["first_name"],
                        "last_name": udata["last_name"],
                        "phone": udata["phone"],
                        "is_staff": udata["is_staff"],
                        "is_superuser": udata["is_superuser"],
                        "email_verified_at": timezone.now(),
                    },
                )
                if u_created:
                    user.set_password("StockPro2026!")
                    user.save()
                    self.stdout.write(f"  ✓ Utilisateur créé : {user.email} (MDP: StockPro2026!)")

                # Membership
                Membership.objects.get_or_create(
                    user=user,
                    organization=org,
                    defaults={"role": udata["role"], "is_active": True},
                )
                created_users[udata["email"]] = user

            # 3. Dépôts
            warehouses_data = [
                {
                    "name": "Dépôt Central (Zone Portuaire)",
                    "code": "DEP-CENTRAL",
                    "city": "Cotonou",
                    "address": "Boulevard de la Marina, Zone Portuaire",
                    "manager_name": "Alain Gbaguidi",
                },
                {
                    "name": "Boutique Marché Dantokpa",
                    "code": "MAG-DANTOKPA",
                    "city": "Cotonou",
                    "address": "Hangar 4B, Grand Marché",
                    "manager_name": "Mireille Houessou",
                },
            ]

            wh_objs = {}
            for wh in warehouses_data:
                obj, wh_created = Warehouse.objects.get_or_create(
                    organization=org,
                    code=wh["code"],
                    defaults={
                        "name": wh["name"],
                        "city": wh["city"],
                        "address": wh["address"],
                        "manager_name": wh["manager_name"],
                        "is_active": True,
                    },
                )
                wh_objs[wh["code"]] = obj
                if wh_created:
                    self.stdout.write(f"  ✓ Dépôt créé : {obj.name} ({obj.code})")

            wh_central = wh_objs["DEP-CENTRAL"]
            wh_dantokpa = wh_objs["MAG-DANTOKPA"]

            # 4. Catégories
            categories_data = [
                {"name": "Boissons & Brasserie", "key": "boissons"},
                {"name": "Agroalimentaire & Épicerie", "key": "alimentaire"},
                {"name": "Matériaux & Quincaillerie", "key": "quincaillerie"},
                {"name": "Hygiène & Entretien", "key": "hygiene"},
            ]
            cat_objs = {}
            for cdata in categories_data:
                cat, _ = Category.objects.get_or_create(
                    organization=org,
                    name=cdata["name"],
                )
                cat_objs[cdata["key"]] = cat

            # 5. Produits réels (20)
            products_data = [
                # Boissons
                {
                    "name": "Casier 24 Bouteilles Beaufort Lager 50cl",
                    "sku": "BOIS-BEAU01",
                    "barcode": "618110010001",
                    "category": cat_objs["boissons"],
                    "unit": "Casier",
                    "purchase_price": 7200,
                    "selling_price": 9000,
                    "minimum_stock": 15,
                    "q_central": 80,
                    "q_dantokpa": 30,
                },
                {
                    "name": "Casier 24 Bouteilles Castel Beer 50cl",
                    "sku": "BOIS-CAST02",
                    "barcode": "618110010002",
                    "category": cat_objs["boissons"],
                    "unit": "Casier",
                    "purchase_price": 7000,
                    "selling_price": 8500,
                    "minimum_stock": 15,
                    "q_central": 70,
                    "q_dantokpa": 25,
                },
                {
                    "name": "Pack 6 Bouteilles Eau Minérale Possotomé 1.5L",
                    "sku": "BOIS-POSS03",
                    "barcode": "618110010003",
                    "category": cat_objs["boissons"],
                    "unit": "Pack",
                    "purchase_price": 1800,
                    "selling_price": 2400,
                    "minimum_stock": 25,
                    "q_central": 150,
                    "q_dantokpa": 60,
                },
                {
                    "name": "Carton 24 Canettes Coca-Cola 33cl",
                    "sku": "BOIS-COCA04",
                    "barcode": "5449000000996",
                    "category": cat_objs["boissons"],
                    "unit": "Carton",
                    "purchase_price": 6000,
                    "selling_price": 7500,
                    "minimum_stock": 10,
                    "q_central": 60,
                    "q_dantokpa": 20,
                },
                {
                    "name": "Carton 24 Canettes Youki Cocktail 33cl",
                    "sku": "BOIS-YOUK05",
                    "barcode": "618110010005",
                    "category": cat_objs["boissons"],
                    "unit": "Carton",
                    "purchase_price": 5500,
                    "selling_price": 7000,
                    "minimum_stock": 10,
                    "q_central": 50,
                    "q_dantokpa": 15,
                },
                # Agroalimentaire
                {
                    "name": "Sac de Riz Parfumé Jasmin 25kg Papillon",
                    "sku": "ALIM-RIZ25",
                    "barcode": "893456789012",
                    "category": cat_objs["alimentaire"],
                    "unit": "Sac",
                    "purchase_price": 14500,
                    "selling_price": 17500,
                    "minimum_stock": 20,
                    "q_central": 120,
                    "q_dantokpa": 45,
                },
                {
                    "name": "Carton Huile Raffinée Végétale Dinor 4x5L",
                    "sku": "ALIM-HUIL01",
                    "barcode": "618220020001",
                    "category": cat_objs["alimentaire"],
                    "unit": "Carton",
                    "purchase_price": 19500,
                    "selling_price": 23000,
                    "minimum_stock": 10,
                    "q_central": 55,
                    "q_dantokpa": 18,
                },
                {
                    "name": "Carton Sucre en Morceaux Saint-Louis 25kg",
                    "sku": "ALIM-SUCR02",
                    "barcode": "618220020002",
                    "category": cat_objs["alimentaire"],
                    "unit": "Carton",
                    "purchase_price": 18000,
                    "selling_price": 21500,
                    "minimum_stock": 8,
                    "q_central": 40,
                    "q_dantokpa": 12,
                },
                {
                    "name": "Carton Lait Concentré Sucré Bonnet Rouge 48x410g",
                    "sku": "ALIM-LAIT03",
                    "barcode": "871280000123",
                    "category": cat_objs["alimentaire"],
                    "unit": "Carton",
                    "purchase_price": 26000,
                    "selling_price": 31000,
                    "minimum_stock": 10,
                    "q_central": 45,
                    "q_dantokpa": 16,
                },
                {
                    "name": "Carton Pâte Tomate Concentrée Gino 50x70g",
                    "sku": "ALIM-TOM04",
                    "barcode": "618220020004",
                    "category": cat_objs["alimentaire"],
                    "unit": "Carton",
                    "purchase_price": 6800,
                    "selling_price": 8500,
                    "minimum_stock": 15,
                    "q_central": 90,
                    "q_dantokpa": 35,
                },
                {
                    "name": "Sac Farine de Blé Boulangère Grands Moulins 50kg",
                    "sku": "ALIM-FARI05",
                    "barcode": "618220020005",
                    "category": cat_objs["alimentaire"],
                    "unit": "Sac",
                    "purchase_price": 21000,
                    "selling_price": 24500,
                    "minimum_stock": 15,
                    "q_central": 65,
                    "q_dantokpa": 20,
                },
                {
                    "name": "Carton Spaghettis Pasta Maman 20x500g",
                    "sku": "ALIM-PATE06",
                    "barcode": "618220020006",
                    "category": cat_objs["alimentaire"],
                    "unit": "Carton",
                    "purchase_price": 7500,
                    "selling_price": 9500,
                    "minimum_stock": 20,
                    "q_central": 85,
                    "q_dantokpa": 40,
                },
                # Quincaillerie & BTP
                {
                    "name": "Sac Ciment Portland Dangote 42.5R 50kg",
                    "sku": "QUIN-CIM50",
                    "barcode": "618330030001",
                    "category": cat_objs["quincaillerie"],
                    "unit": "Sac",
                    "purchase_price": 3800,
                    "selling_price": 4400,
                    "minimum_stock": 50,
                    "q_central": 350,
                    "q_dantokpa": 90,
                },
                {
                    "name": "Paquet Pointes Acier de Charpente 5kg (70mm)",
                    "sku": "QUIN-POIN01",
                    "barcode": "618330030002",
                    "category": cat_objs["quincaillerie"],
                    "unit": "Paquet",
                    "purchase_price": 4200,
                    "selling_price": 5500,
                    "minimum_stock": 10,
                    "q_central": 45,
                    "q_dantokpa": 15,
                },
                {
                    "name": "Rouleau Fil de Fer Galvanisé Lié 25kg",
                    "sku": "QUIN-FIL02",
                    "barcode": "618330030003",
                    "category": cat_objs["quincaillerie"],
                    "unit": "Rouleau",
                    "purchase_price": 13500,
                    "selling_price": 16500,
                    "minimum_stock": 6,
                    "q_central": 25,
                    "q_dantokpa": 8,
                },
                {
                    "name": "Seau Peinture Seigneurie Vinyle Blanche 20kg",
                    "sku": "QUIN-PEIN03",
                    "barcode": "618330030004",
                    "category": cat_objs["quincaillerie"],
                    "unit": "Seau",
                    "purchase_price": 22000,
                    "selling_price": 27500,
                    "minimum_stock": 8,
                    "q_central": 35,
                    "q_dantokpa": 10,
                },
                # Hygiène & Entretien
                {
                    "name": "Carton Savon de Marseille BF 48x200g",
                    "sku": "HYGI-SAV01",
                    "barcode": "618440040001",
                    "category": cat_objs["hygiene"],
                    "unit": "Carton",
                    "purchase_price": 6200,
                    "selling_price": 7800,
                    "minimum_stock": 15,
                    "q_central": 60,
                    "q_dantokpa": 25,
                },
                {
                    "name": "Carton Eau de Javel La Croix 12x1L",
                    "sku": "HYGI-JAV02",
                    "barcode": "618440040002",
                    "category": cat_objs["hygiene"],
                    "unit": "Carton",
                    "purchase_price": 4800,
                    "selling_price": 6200,
                    "minimum_stock": 10,
                    "q_central": 40,
                    "q_dantokpa": 18,
                },
                {
                    "name": "Carton Lessive en Poudre OMO 24x400g",
                    "sku": "HYGI-OMO03",
                    "barcode": "618440040003",
                    "category": cat_objs["hygiene"],
                    "unit": "Carton",
                    "purchase_price": 8400,
                    "selling_price": 10500,
                    "minimum_stock": 10,
                    "q_central": 50,
                    "q_dantokpa": 20,
                },
                {
                    "name": "Carton Insecticide Aérosol Rambo 24x400ml",
                    "sku": "HYGI-RAM04",
                    "barcode": "618440040004",
                    "category": cat_objs["hygiene"],
                    "unit": "Carton",
                    "purchase_price": 18000,
                    "selling_price": 22000,
                    "minimum_stock": 8,
                    "q_central": 30,
                    "q_dantokpa": 12,
                },
            ]

            created_products = []
            admin_user = created_users["admin@stockpro.test"]

            for pdata in products_data:
                prod, p_created = Product.objects.get_or_create(
                    organization=org,
                    sku=pdata["sku"],
                    defaults={
                        "name": pdata["name"],
                        "barcode": pdata["barcode"],
                        "category": pdata["category"],
                        "unit": pdata["unit"],
                        "purchase_price": pdata["purchase_price"],
                        "selling_price": pdata["selling_price"],
                        "minimum_stock": pdata["minimum_stock"],
                        "is_active": True,
                    },
                )
                created_products.append(prod)

                # Positions et mouvements initiaux
                for wh, qty in [(wh_central, pdata["q_central"]), (wh_dantokpa, pdata["q_dantokpa"])]:
                    pos, pos_created = StockPosition.objects.get_or_create(
                        organization=org,
                        product=prod,
                        warehouse=wh,
                        defaults={"quantity": qty},
                    )
                    if pos_created and qty > 0:
                        StockMovement.objects.create(
                            organization=org,
                            product=prod,
                            warehouse=wh,
                            type=MovementType.INITIAL,
                            quantity=qty,
                            unit_cost=prod.purchase_price,
                            reference_type="INVENTORY_INIT",
                            reference_id=f"INIT-{prod.sku}",
                            reason="Stock initial inventaire de démarrage",
                            created_by=admin_user,
                        )

            self.stdout.write(self.style.SUCCESS(f"✓ {len(created_products)} produits réels configurés avec stock initial."))

            # 6. Fournisseurs
            suppliers_data = [
                {
                    "name": "SOBEBRA S.A. (Société des Brasseries du Bénin)",
                    "contact_name": "Jean-Baptiste Houndété",
                    "email": "commandes@sobebra.bj",
                    "phone": "+229 21 33 11 22",
                    "city": "Cotonou",
                    "country": "BJ",
                    "address": "Zone Portuaire, Akpakpa",
                    "notes": "Fournisseur exclusif de bières et boissons gazeuses.",
                },
                {
                    "name": "Les Grands Moulins du Bénin (GMB)",
                    "contact_name": "Chantal Dossou",
                    "email": "ventes@gmb-benin.com",
                    "phone": "+229 21 31 20 40",
                    "city": "Cotonou",
                    "country": "BJ",
                    "address": "Avenue Jean-Paul II",
                    "notes": "Farine boulangère et céréales panifiables.",
                },
                {
                    "name": "Dangote Cement Bénin S.A.",
                    "contact_name": "Ibrahim Adeyemi",
                    "email": "commercial.benin@dangote.com",
                    "phone": "+229 21 30 77 88",
                    "city": "Sèmè-Kpodji",
                    "country": "BJ",
                    "address": "Usine de broyage, Route de Porto-Novo",
                    "notes": "Ciment Portland 42.5R en gros.",
                },
                {
                    "name": "CFAO Consumer Retail & Distribution",
                    "contact_name": "Marc Kpodanho",
                    "email": "distribution@cfao-benin.com",
                    "phone": "+229 21 32 05 00",
                    "city": "Cotonou",
                    "country": "BJ",
                    "address": "Boulevard Saint-Michel",
                    "notes": "Importateur de riz parfumé, conserves et huiles végétales.",
                },
            ]

            created_suppliers = []
            for sdata in suppliers_data:
                sup, _ = Supplier.objects.get_or_create(
                    organization=org,
                    name=sdata["name"],
                    defaults=sdata,
                )
                created_suppliers.append(sup)

            self.stdout.write(self.style.SUCCESS(f"✓ {len(created_suppliers)} fournisseurs partenaires enregistrés."))

            # 7. Clients
            customers_data = [
                {
                    "name": "Établissements Maman Kofo & Fils",
                    "phone": "+229 97 12 34 56",
                    "email": "mamankofo@gmail.com",
                    "city": "Cotonou",
                    "address": "Grand Marché Dantokpa, Hangar 4B",
                    "notes": "Demi-grossiste alimentaire. Règlements comptant ou à 48h.",
                },
                {
                    "name": "Superette Étoile Brillante",
                    "phone": "+229 96 45 67 89",
                    "email": "etoile.brillante@yahoo.fr",
                    "city": "Cotonou",
                    "address": "Haie Vive, Avenue Steinmetz",
                    "notes": "Commerce de proximité haut débit en boissons et produits laitiers.",
                },
                {
                    "name": "Quincaillerie BTP du Carrefour Calavi",
                    "phone": "+229 95 88 77 66",
                    "email": "calavi.quincaillerie@gmail.com",
                    "city": "Abomey-Calavi",
                    "address": "Carrefour Kpota, RNIE 2",
                    "notes": "Achats fréquents de ciment et fer.",
                },
                {
                    "name": "Alimentation Générale de la Paix",
                    "phone": "+229 90 22 33 44",
                    "email": "agpaix@cotonou.bj",
                    "city": "Porto-Novo",
                    "address": "Quartier Ouando",
                    "notes": "Client régulier en riz et sucre.",
                },
            ]

            created_customers = []
            for cdata in customers_data:
                cust, _ = Customer.objects.get_or_create(
                    organization=org,
                    name=cdata["name"],
                    defaults=cdata,
                )
                created_customers.append(cust)

            self.stdout.write(self.style.SUCCESS(f"✓ {len(created_customers)} clients commerciaux enregistrés."))

            # 8. Commandes d'achats d'exemple
            p1, p1_created = Purchase.objects.get_or_create(
                organization=org,
                reference="PO-2026-001",
                defaults={
                    "supplier": created_suppliers[0],  # SOBEBRA
                    "warehouse": wh_central,
                    "status": PurchaseStatus.RECEIVED,
                    "purchase_date": datetime.date(2026, 9, 10),
                    "subtotal": 144000,
                    "discount": 0,
                    "tax": 0,
                    "total": 144000,
                    "created_by": admin_user,
                },
            )
            if p1_created:
                PurchaseItem.objects.create(
                    purchase=p1,
                    product=created_products[0],
                    quantity=20,
                    quantity_received=20,
                    unit_price=7200,
                    total=144000,
                )

            p2, p2_created = Purchase.objects.get_or_create(
                organization=org,
                reference="PO-2026-002",
                defaults={
                    "supplier": created_suppliers[2],  # Dangote
                    "warehouse": wh_central,
                    "status": PurchaseStatus.CONFIRMED,
                    "purchase_date": datetime.date(2026, 9, 18),
                    "subtotal": 380000,
                    "discount": 0,
                    "tax": 0,
                    "total": 380000,
                    "created_by": admin_user,
                },
            )
            if p2_created:
                PurchaseItem.objects.create(
                    purchase=p2,
                    product=created_products[12],  # Ciment Dangote
                    quantity=100,
                    quantity_received=0,
                    unit_price=3800,
                    total=380000,
                )

            # 9. Ventes d'exemple
            s1, s1_created = Sale.objects.get_or_create(
                organization=org,
                reference="VTE-2026-001",
                defaults={
                    "customer": created_customers[0],
                    "warehouse": wh_dantokpa,
                    "status": SaleStatus.COMPLETED,
                    "sale_date": datetime.date(2026, 9, 20),
                    "subtotal": 87500,
                    "discount": 0,
                    "tax": 0,
                    "total": 87500,
                    "created_by": admin_user,
                    "completed_at": timezone.now(),
                },
            )
            if s1_created:
                SaleItem.objects.create(
                    sale=s1,
                    product=created_products[5],  # Sac de riz
                    quantity=5,
                    unit_price=17500,
                    total=87500,
                )

            s2, s2_created = Sale.objects.get_or_create(
                organization=org,
                reference="VTE-2026-002",
                defaults={
                    "customer": created_customers[1],
                    "warehouse": wh_dantokpa,
                    "status": SaleStatus.DRAFT,
                    "sale_date": datetime.date(2026, 9, 21),
                    "subtotal": 45000,
                    "discount": 0,
                    "tax": 0,
                    "total": 45000,
                    "created_by": admin_user,
                },
            )
            if s2_created:
                SaleItem.objects.create(
                    sale=s2,
                    product=created_products[0],  # Beaufort
                    quantity=5,
                    unit_price=9000,
                    total=45000,
                )

            self.stdout.write(self.style.SUCCESS("✓ Historique de ventes et achats démo initialisé."))

        self.stdout.write(self.style.SUCCESS("\n" + "=" * 55))
        self.stdout.write(self.style.SUCCESS("🎉 PEUPLEMENT STOCKPRO TERMINÉ AVEC SUCCÈS !"))
        self.stdout.write(self.style.SUCCESS("=" * 55))
        self.stdout.write(f"• Organisation : {org.name} (Devise: {org.currency})")
        self.stdout.write(f"• Dépôts : {Warehouse.objects.filter(organization=org).count()} dépôts")
        self.stdout.write(f"• Produits : {Product.objects.filter(organization=org).count()} articles")
        self.stdout.write(f"• Fournisseurs : {Supplier.objects.filter(organization=org).count()}")
        self.stdout.write(f"• Clients : {Customer.objects.filter(organization=org).count()}")
        self.stdout.write("\nIdentifiants de test :")
        self.stdout.write("  Admin/Owner : admin@stockpro.test / StockPro2026!")
        self.stdout.write("  Gestionnaire : manager@stockpro.test / StockPro2026!")
        self.stdout.write("  Caissier : cashier@stockpro.test / StockPro2026!")
        self.stdout.write("=" * 55 + "\n")
