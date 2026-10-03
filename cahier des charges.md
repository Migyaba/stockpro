# STOCKPRO SaaS

## Cahier des charges fonctionnel et technique

**Version :** 1.1
**Statut :** Document de conception — décisions métier verrouillées
**Type de produit :** SaaS B2B multi-tenant
**Cible initiale :** Commerces et boutiques d'Afrique francophone
**Marché pilote :** Afrique francophone — avec validation initiale au Bénin
**Architecture cible :** Application Web SaaS multi-tenant
**Backend :** Python / Django / Django REST Framework
**Frontend :** React / Vite / TypeScript / Tailwind CSS / shadcn/ui
**Base de données :** PostgreSQL

### Historique

| Version | Date | Nature |
|---|---|---|
| 1.0 | 2026-09 | Conception initiale |
| 1.1 | 2026-09-14 | Complément des décisions manquantes : instants de mouvement de stock, membership, matrice de permissions, MVP vs V1, variantes, réception partielle, concurrence, montants, TVA, suppressions logiques |

Ce document est la **source des décisions produit**. L'architecture fonctionnelle détaillée le complète ; en cas d'écart, le présent cahier des charges prévaut.

---

# 1. Présentation du projet

## 1.1. Nom du projet

**STOCKPRO**

STOCKPRO est une plateforme SaaS destinée aux petites et moyennes entreprises commerciales permettant de centraliser la gestion de leurs produits, stocks, achats, ventes, fournisseurs, clients, inventaires et opérations entre plusieurs points de stockage.

La plateforme est conçue selon une architecture **multi-tenant**, permettant à plusieurs entreprises indépendantes d'utiliser la même infrastructure applicative tout en garantissant une isolation stricte de leurs données.

---

# 2. Contexte et problématique

De nombreux commerces et petites entreprises d'Afrique francophone utilisent encore des méthodes fragmentées pour gérer leurs activités :

* cahiers papier ;
* fichiers Excel ;
* applications de caisse limitées ;
* WhatsApp ;
* fichiers dispersés entre plusieurs employés ;
* inventaires manuels ;
* absence d'historique fiable des mouvements ;
* absence de visibilité en temps réel sur le stock ;
* difficulté à déterminer les marges ;
* mauvaise synchronisation entre plusieurs boutiques ou dépôts.

Ces méthodes deviennent particulièrement problématiques lorsque l'entreprise :

* possède plusieurs employés ;
* possède plusieurs points de vente ;
* possède plusieurs dépôts ;
* réalise plusieurs dizaines ou centaines d'opérations par jour ;
* souhaite contrôler les erreurs et pertes ;
* souhaite connaître la rentabilité de ses produits.

STOCKPRO doit apporter une solution simple, moderne et accessible permettant au commerçant de disposer d'une **source unique de vérité concernant son activité commerciale et son stock**.

---

# 3. Vision du produit

La vision de STOCKPRO est de devenir une plateforme de référence pour la gestion opérationnelle des commerces et PME commerciales en Afrique francophone.

L'objectif n'est pas de reproduire immédiatement un ERP complexe.

STOCKPRO doit commencer par exceller sur un problème précis :

> **Permettre à une entreprise de savoir à tout moment ce qu'elle possède, où cela se trouve, ce qui est entré, ce qui est sorti, ce qui a été vendu et ce qui doit être réapprovisionné.**

À terme, la plateforme pourra évoluer vers une solution complète de gestion commerciale.

---

# 4. Proposition de valeur

STOCKPRO doit permettre à une entreprise de :

* centraliser ses produits ;
* connaître son stock en temps réel ;
* gérer plusieurs dépôts et boutiques ;
* suivre les entrées et sorties ;
* gérer les achats ;
* gérer les ventes ;
* suivre les clients et fournisseurs ;
* réaliser des inventaires ;
* identifier les produits en rupture ou bientôt en rupture ;
* suivre les marges ;
* contrôler les opérations réalisées par les employés ;
* consulter son activité depuis ordinateur ou smartphone.

---

# 5. Objectifs du projet

## 5.1. Objectifs fonctionnels

Le système doit permettre :

1. la création d'une organisation ;
2. la gestion des utilisateurs ;
3. la gestion des rôles et permissions ;
4. la gestion des produits ;
5. la gestion des catégories ;
6. la gestion des dépôts ;
7. la gestion des stocks ;
8. la gestion des mouvements ;
9. la gestion des transferts ;
10. la gestion des fournisseurs ;
11. la gestion des achats ;
12. la gestion des clients ;
13. la gestion des ventes ;
14. la réalisation d'inventaires ;
15. le suivi des marges ;
16. la génération de rapports ;
17. l'importation de produits ;
18. la traçabilité des opérations ;
19. la génération d'alertes ;
20. la consultation d'un tableau de bord.

Ces objectifs décrivent le **produit V1**. Ils ne sont pas tous livrés dans le **MVP pilote**. Voir §5.2 et §77.

## 5.2. Priorisation

| Priorité | Nom | Objectif |
|---|---|---|
| **P0** | Fondations | Auth, organisations, membership, rôles, isolation, dépôts |
| **P1** | Cœur métier | Catalogue simple, stock, mouvements, achats, ventes, clients, fournisseurs, transferts |
| **P2** | Contrôle | Inventaires, alertes, audit, dashboard, rapports |
| **P3** | Productivité | Import CSV/Excel, scan caméra, exports PDF/Excel, PWA |
| **P4** | SaaS commercial | Plans, trial automatisé, limitations, paiement, back-office plateforme |

**MVP pilote (première mise en boutique au Bénin) = P0 + P1 + dashboard minimal.**

**V1 commerciale = MVP pilote + P2.**

**V1.1 = P3.** Les plans payants (P4) peuvent rester manuels pendant le pilote.

## 5.3. Décisions de périmètre verrouillées

| Sujet | Décision V1 / MVP |
|---|---|
| Variantes produits | Modèle prévu (`parent_id`) ; **pas d'UI variantes** dans le MVP ni la V1 |
| Catégories | Liste **plate** ; `parent_id` nullable pour plus tard |
| Import Excel | **P3 / V1.1** — le pilote crée les produits à la main |
| Scan caméra | **P3** — la recherche par code-barres saisi reste en P1 |
| Réservation de stock | **Hors V1** — un brouillon de vente ne bloque pas le stock |
| Transfert en transit | **Hors V1** — transfert atomique source → destination |
| Encaissement / crédit client | **Hors V1** — une vente validée est considérée comme effectuée |
| Conversion d'unités | **Hors V1** — unité = libellé libre (`pièce`, `kg`, `carton`) |
| Multi-organisations UI | **Hors V1** — le schéma membership le permet déjà |
| Ajustement manuel libre | **Interdit** — le stock ne bouge que via les opérations métier |

---

# 6. Objectifs non fonctionnels

STOCKPRO devra être :

### Sécurisé

Les données d'une organisation ne doivent jamais être accessibles à une autre organisation.

### Scalable

L'architecture doit pouvoir accueillir progressivement plusieurs centaines puis plusieurs milliers d'organisations.

### Maintenable

Le code doit être modulaire et respecter une séparation claire des responsabilités.

### Performant

Les opérations courantes doivent rester rapides même avec plusieurs milliers de produits par organisation.

### Responsive

L'application doit être utilisable :

* sur ordinateur ;
* tablette ;
* smartphone.

### Accessible

L'interface doit être adaptée aux utilisateurs qui ne sont pas nécessairement techniciens.

---

# 7. Cible utilisateur

## 7.1. Segment principal

STOCKPRO cible principalement :

* commerces ;
* boutiques ;
* magasins ;
* petites chaînes de boutiques ;
* distributeurs ;
* petits grossistes.

## 7.2. Exemples de secteurs

La plateforme devra pouvoir fonctionner notamment pour :

* vêtements ;
* chaussures ;
* cosmétiques ;
* téléphones et accessoires ;
* électroménager ;
* alimentation ;
* pièces détachées ;
* quincaillerie ;
* produits divers.

Le système doit rester suffisamment générique pour ne pas être limité à un secteur particulier.

## 7.3. Personas

### Owner — commerçant / gérant

Crée l'organisation, configure les paramètres, invite l'équipe, consulte marges et rapports, valide les inventaires sensibles. Souvent peu technicien. Utilise surtout le **desktop**.

### Manager — responsable de boutique ou d'entrepôt

Gère le quotidien d'un ou plusieurs dépôts : achats, réceptions, ventes, transferts, comptage. Peut accorder des remises dans une limite. N'invite pas les utilisateurs et ne change pas l'abonnement.

### Staff — vendeur / magasinier

Saisit les ventes, consulte le stock de **son** dépôt, recherche un produit par nom ou code-barres. Interface **smartphone** prioritaire. Ne voit pas les prix d'achat ni les marges. Ne valide pas les inventaires.

---

# 8. Zone géographique

## 8.1. Marché initial

Afrique francophone.

## 8.2. Pays prioritaires potentiels

La conception doit permettre de supporter notamment :

* Bénin ;
* Togo ;
* Côte d'Ivoire ;
* Sénégal ;
* Burkina Faso ;
* Niger ;
* Guinée ;
* Cameroun ;
* Gabon ;
* Congo ;
* République démocratique du Congo ;
* autres marchés francophones.

## 8.3. Internationalisation

Le système devra prévoir :

* pays ;
* devise ;
* fuseau horaire ;
* langue ;
* formats numériques ;
* formats de date.

La première langue sera le français.

---

# 9. Architecture multi-tenant

## 9.1. Principe

STOCKPRO sera une application multi-tenant.

Une organisation représente une entreprise cliente.

Exemple :

```text
STOCKPRO
│
├── Organisation A
│   ├── Utilisateurs
│   ├── Produits
│   ├── Stocks
│   ├── Ventes
│   └── Achats
│
├── Organisation B
│   ├── Utilisateurs
│   ├── Produits
│   ├── Stocks
│   ├── Ventes
│   └── Achats
│
└── Organisation C
    ├── Utilisateurs
    ├── Produits
    ├── Stocks
    ├── Ventes
    └── Achats
```

---

# 10. Stratégie de multi-tenancy

La V1 utilisera une architecture :

> **Base PostgreSQL partagée avec isolation logique par `organization_id`.**

Les ressources métier principales seront associées à une organisation.

Exemple :

```text
Product
---------
id
organization_id
name
sku
...
```

Toutes les requêtes métier devront appliquer l'isolation correspondant à l'organisation de l'utilisateur authentifié.

Une organisation ne devra jamais pouvoir accéder à une ressource appartenant à une autre organisation, même si son identifiant technique est connu.

## 10.1. Mise en œuvre V1

* chaque ressource métier porte un `organization_id` obligatoire ;
* un **manager Django** (queryset par défaut) filtre toujours sur l'organisation du contexte ;
* le contexte d'organisation est lu depuis le JWT / la session, **jamais** depuis un paramètre d'URL ou un champ du body que le client pourrait falsifier ;
* une tentative d'accès à une ressource d'une autre organisation doit renvoyer **404** (pas 403), afin de ne pas révéler l'existence de l'objet ;
* des tests automatisés d'isolation (IDOR) sont **obligatoires** avant toute mise en production ;
* le Row Level Security PostgreSQL pourra être ajouté plus tard comme défense en profondeur ; il n'est pas requis pour le MVP.

L'équipe STOCKPRO (back-office plateforme) utilise un espace **distinct**, avec des permissions `platform.*`, et n'emprunte pas les écrans métier d'une organisation cliente sans journal d'audit.

---

# 11. Gestion des organisations

Chaque organisation possède :

* identifiant ;
* nom ;
* slug ;
* logo ;
* adresse ;
* téléphone ;
* email ;
* pays ;
* devise ;
* nombre de décimales de la devise (`currency_exponent`) ;
* fuseau horaire ;
* langue (français en V1) ;
* format de date ;
* TVA activée (oui/non, **non par défaut**) ;
* taux de TVA unique (ex. 18 %) ;
* prix TTC ou HT (`prices_include_tax`, **TTC par défaut**) ;
* statut ;
* date de création.

## 11.1. Statuts

Une organisation peut être :

```text
ACTIVE
TRIAL
SUSPENDED
CANCELLED
```

---

# 12. Inscription et onboarding

Le parcours initial :

```text
Inscription
     ↓
Création du compte
     ↓
Création de l'organisation
     ↓
Informations générales
     ↓
Configuration du premier dépôt
     ↓
Ajout des premiers produits
     ↓
Dashboard
```

L'utilisateur doit pouvoir commencer à utiliser STOCKPRO rapidement.

Un second parcours existe : **rejoindre une organisation** via une invitation email.

Checklist d'onboarding (affichée jusqu'à complétion) :

```text
✓ Organisation créée
✓ Premier dépôt créé
□ Ajouter vos produits
□ Initialiser le stock
□ Inviter un utilisateur
□ Effectuer votre première vente ou votre premier achat
```

---

# 13. Authentification

Le système devra prendre en charge :

* inscription ;
* connexion ;
* déconnexion ;
* récupération de mot de passe ;
* changement de mot de passe ;
* vérification d'email ;
* gestion des sessions ;
* expiration des tokens.

## 13.1. JWT

L'API utilise JWT avec **deux jetons** :

| Jeton | Durée | Usage |
|---|---|---|
| Access | 30 minutes | Appels API |
| Refresh | 14 jours | Rotation : chaque usage émet un nouveau refresh |

Le refresh token est stocké **hashé** côté serveur et révocable (déconnexion, changement de mot de passe).

Claims obligatoires de l'access token :

```text
user_id
membership_id
organization_id
role
```

Le client ne peut pas changer `organization_id` en le mettant dans le body. Un changement d'organisation (V2) exigera un nouveau couple de jetons.

## 13.2. Compte

* email **unique** au niveau plateforme ;
* mot de passe hashé (Argon2 ou PBKDF2 Django), minimum 8 caractères ;
* limitation des tentatives de connexion ;
* l'owner peut démarrer l'onboarding avant vérification d'email ;
* **inviter un utilisateur** et **exporter des données** exigent un email vérifié.

---

# 14. Utilisateurs

L'identité (`User`) est globale. L'appartenance à une entreprise est un **membership**.

En V1, l'interface n'expose qu'**une organisation à la fois**. Le schéma permet plusieurs memberships pour un même email, afin de ne pas casser une évolution multi-org.

## 14.1. User

```text
User
----
id
first_name
last_name
email                unique
phone
password_hash
is_active
email_verified_at
last_login
created_at
```

## 14.2. Membership

```text
Membership
----------
id
user_id
organization_id
role                 OWNER | ADMINISTRATOR | MANAGER | STAFF
is_active
created_at

unicité (user_id, organization_id)
```

## 14.3. Accès aux dépôts

```text
MembershipWarehouse
-------------------
membership_id
warehouse_id
```

Règle :

* Owner et Administrator : **tous** les dépôts, même sans ligne `MembershipWarehouse` ;
* Manager et Staff : si aucune ligne n'est définie, accès à **tous** les dépôts de l'organisation ; si au moins une ligne existe, accès **uniquement** à ces dépôts ;
* une opération de stock, vente, achat, transfert ou inventaire est refusée si le dépôt n'est pas autorisé.

## 14.4. Invitation

```text
Invitation
----------
id
organization_id
email
role
token_hash
expires_at           (7 jours)
invited_by
accepted_at
```

* si l'email n'a pas encore de compte : inscription puis rattachement ;
* si l'email a déjà un compte : acceptation → nouveau membership ;
* si l'email a déjà un membership **dans cette organisation** : erreur métier.

Le premier utilisateur qui crée l'organisation en devient **Owner**. Il ne peut pas être rétrogradé tant qu'un autre Owner n'a pas été désigné. Une organisation a **au moins un** Owner actif.

---

# 15. Rôles

La V1 prévoit quatre rôles. Ils sont **fixes** (pas d'éditeur de rôles personnalisés en V1).

### Owner

Propriétaire. Accès complet, y compris abonnement, suppression logique de l'organisation, et annulation d'opérations validées.

### Administrator

Gestion administrative et opérationnelle. Pas d'abonnement ni de transfert de propriété.

### Manager

Opérations quotidiennes (achats, ventes, stock, inventaires). Pas d'utilisateurs, pas de paramètres d'organisation, pas d'abonnement.

### Staff

Ventes et consultation du stock autorisé. Pas de prix d'achat, pas de marges, pas de validation d'inventaire, pas d'annulation d'opération validée.

---

# 16. Permissions

Les permissions sont définies par module. Le backend les applique **toujours** ; le frontend ne fait que masquer les menus.

```text
products.view | products.create | products.update | products.deactivate
stock.view
stock.transfer
purchases.view | purchases.create | purchases.confirm | purchases.receive
sales.view | sales.create | sales.validate | sales.cancel
inventory.view | inventory.create | inventory.count | inventory.validate
reports.view | reports.export
users.view | users.invite | users.update | users.deactivate
settings.view | settings.update
billing.manage
audit.view
```

Il n'existe **pas** de permission `stock.adjust` libre en V1. L'ajustement passe uniquement par un inventaire validé.

## 16.1. Matrice rôles × fonctions

| Fonction | Owner | Admin | Manager | Staff |
|---|---|---|---|---|
| Dashboard opérationnel | ✓ | ✓ | ✓ | ✓ (dépôt autorisé) |
| Produits — CRUD / désactivation | ✓ | ✓ | ✓ | 👁 uniquement |
| Prix d'achat / marges | ✓ | ✓ | ✓ | ✕ |
| Stock — consultation | ✓ | ✓ | ✓ | ✓ (dépôt autorisé) |
| Transferts | ✓ | ✓ | ✓ | ✕ |
| Achats — créer / confirmer / réceptionner | ✓ | ✓ | ✓ | ✕ |
| Ventes — créer / valider | ✓ | ✓ | ✓ | ✓ |
| Ventes — annuler une vente validée | ✓ | ✓ | ✕ | ✕ |
| Remise | Illimitée | Illimitée | Plafond org. (défaut 10 %) | ✕ (0 %) |
| Inventaire — compter | ✓ | ✓ | ✓ | ✓ (si autorisé dépôt) |
| Inventaire — valider | ✓ | ✓ | ✓ | ✕ |
| Rapports complets | ✓ | ✓ | ✓ | ✕ |
| Rapports Staff | — | — | — | Ses ventes du jour |
| Utilisateurs / invitations | ✓ | ✓ | ✕ | ✕ |
| Paramètres organisation | ✓ | ✓ | ✕ | ✕ |
| Abonnement | ✓ | ✕ | ✕ | ✕ |
| Audit | ✓ | ✓ | ✕ | ✕ |

Les plafonds de remise sont des paramètres d'organisation (`max_discount_percent_manager`, défaut 10).

L'objectif est de pouvoir ajouter des rôles personnalisés plus tard sans changer le modèle de permissions.

---

# 17. Gestion des dépôts

Une organisation peut posséder plusieurs dépôts ou points de vente.

Exemple :

```text
Organisation
│
├── Boutique Cotonou
├── Boutique Calavi
└── Entrepôt Porto-Novo
```

## 17.1. Informations

```text
Warehouse
---------
id
organization_id
name
code
address
city
manager
is_active
created_at
```

---

# 18. Gestion des catégories

Les produits pourront être regroupés par catégories.

Exemple :

```text
Vêtements
├── Hommes
├── Femmes
└── Enfants

Chaussures
├── Hommes
├── Femmes
└── Enfants
```

Une catégorie appartient à une organisation.

En V1, les catégories sont **plates** (un niveau). Le champ `parent_id` existe et reste `NULL`. La hiérarchie pourra être activée sans migration destructive.

Une catégorie utilisée par des produits ne se supprime pas : elle est désactivée (`is_active = false`).

---

# 19. Gestion des produits

Le produit constitue l'une des ressources principales du système.

## 19.1. Informations produit

```text
Product
-------
id
organization_id
category_id
sku
barcode
name
description
unit
purchase_price
selling_price
minimum_stock
maximum_stock
image
is_active
created_at
updated_at
```

## 19.2. Règles produit

* le SKU est **unique par organisation** parmi les produits actifs ;
* le code-barres, s'il est renseigné, est **unique par organisation** ;
* l'unité est un libellé libre ; **aucune conversion** d'unités en V1 ;
* un produit désactivé ne peut plus être ajouté à une nouvelle vente, un nouvel achat ou un transfert ;
* un produit qui a de l'historique (mouvement, ligne de vente/achat) **n'est jamais supprimé physiquement** ;
* les prix d'une vente déjà validée ne changent pas si le tarif catalogue est modifié ensuite (les lignes de vente copient le prix).

---

# 20. Produits variables

L'architecture devra permettre de gérer des produits possédant des variantes.

Exemple :

```text
T-shirt
│
├── Taille S
├── Taille M
├── Taille L
└── Taille XL
```

Ou :

```text
Chaussure
│
├── 40
├── 41
├── 42
└── 43
```

Cette fonctionnalité est **hors UI V1**.

Le modèle de données prévoit dès maintenant :

```text
Product.parent_id   nullable
Product.is_variant  bool
```

Règle cible (V2) : le parent est le concept commercial ; **seule la variante** (feuille) est suivie en stock, avec son propre SKU, code-barres, prix et position de stock.

En V1, tous les produits sont des feuilles (`parent_id` vide). L'interface ne propose pas la création de variantes.

---

# 21. Codes-barres

Un produit pourra posséder un code-barres.

Le système devra permettre :

* recherche par code-barres ;
* saisie manuelle ;
* scan depuis un appareil compatible ;
* utilisation du code-barres dans les ventes et opérations de stock.

Le scan mobile pourra être réalisé via une interface Web/PWA avant l'éventuelle création d'une application mobile native.

**P1 :** champ code-barres, recherche et saisie manuelle dans les ventes.

**P3 :** scan caméra (PWA).

---

# 22. Gestion du stock

Le stock sera géré au niveau :

```text
Produit + Dépôt
```

Exemple :

```text
Riz 25kg

Dépôt Cotonou : 120
Dépôt Calavi  : 40
Entrepôt      : 250
```

## 22.1. Position de stock (source opérationnelle)

Le stock courant est une **position persistée**, pas un simple calcul à la volée.

```text
StockPosition
-------------
id
organization_id
product_id
warehouse_id
quantity              entier >= 0
updated_at

unicité (organization_id, product_id, warehouse_id)
```

Règle de vérité :

* **combien y a-t-il maintenant ?** → `StockPosition.quantity`
* **pourquoi ce chiffre ?** → somme des `StockMovement` du couple produit + dépôt

Les deux doivent rester égaux. Toute opération métier met à jour **dans la même transaction** la position **et** le mouvement. Une réconciliation (admin / tâche) doit pouvoir détecter un écart.

---

# 23. Stock physique et stock disponible

L'architecture devra permettre de distinguer progressivement :

```text
Stock physique
Stock réservé
Stock disponible
Stock en transit
```

**V1 :**

```text
Stock physique = Stock disponible = StockPosition.quantity
Stock réservé  = 0
Stock en transit = 0
```

Un brouillon de vente, d'achat ou de transfert **ne réserve pas** et **ne déplace pas** de stock.

---

# 24. Mouvements de stock

Le mouvement de stock constitue la trace d'une modification de stock.

Types possibles :

```text
INITIAL
PURCHASE
SALE
SALE_CANCEL
TRANSFER_IN
TRANSFER_OUT
INVENTORY_ADJUSTMENT
RETURN
DAMAGE
OTHER
```

En V1, seuls ces types sont **émis par l'application** :

```text
INITIAL
PURCHASE
SALE
SALE_CANCEL
TRANSFER_IN
TRANSFER_OUT
INVENTORY_ADJUSTMENT
```

`DAMAGE`, `RETURN` (retour client hors annulation) et `OTHER` sont réservés à une version ultérieure. Il n'y a pas de bouton « ajuster le stock » hors inventaire.

La quantité d'un mouvement est **signée** : positive = entrée, négative = sortie. Alternative équivalente : quantité toujours positive + champ `direction` `IN|OUT`. L'implémentation doit choisir **une** convention et s'y tenir.

## 24.1. Informations

```text
StockMovement
-------------
id
organization_id
product_id
warehouse_id
type
quantity
unit_cost
reference_type
reference_id
reason
created_by
created_at
```

---

# 25. Principe de traçabilité

Le stock ne doit pas être modifié arbitrairement.

Exemple :

```text
Achat
 ↓
Réception
 ↓
+100 unités
 ↓
StockMovement
```

Puis :

```text
Vente
 ↓
Validation
 ↓
-10 unités
 ↓
StockMovement
```

Chaque variation importante doit pouvoir être expliquée.

## 25.1. Instants de mouvement — décisions verrouillées

Une opération **validée ne se modifie pas silencieusement**. Toute correction crée un mouvement inverse ou un nouvel événement.

| Opération | Statut | Effet stock |
|---|---|---|
| Stock initial (onboarding / création produit) | — | `INITIAL` (+) sur le dépôt indiqué |
| Achat | `DRAFT`, `CONFIRMED` | aucun |
| Réception d'achat | réception validée | `PURCHASE` (+) de la quantité **réellement reçue** |
| Vente | `DRAFT` | aucun (pas de réservation) |
| Vente | `COMPLETED` | `SALE` (−) atomique |
| Annulation vente validée | `CANCELLED` | `SALE_CANCEL` (+) de la quantité vendue |
| Transfert | `DRAFT` | aucun |
| Transfert | `COMPLETED` | `TRANSFER_OUT` (−) source **et** `TRANSFER_IN` (+) destination, même transaction |
| Inventaire | `DRAFT`, `COUNTING`, `REVIEW` | aucun |
| Inventaire | `VALIDATED` | un `INVENTORY_ADJUSTMENT` par écart ≠ 0 |

### Messages d'erreur métier

Les erreurs doivent être lisibles, par exemple :

```text
Impossible de valider cette vente.

Stock insuffisant pour :
T-shirt noir — Taille M
Demandé : 10
Disponible : 4
Dépôt : Cotonou
```

Codes API associés : `STOCK_INSUFFICIENT`, `WAREHOUSE_FORBIDDEN`, `INVALID_STATE_TRANSITION`, `IDEMPOTENCY_CONFLICT`.

---

# 26. Transferts entre dépôts

Un utilisateur autorisé pourra transférer un produit :

```text
Dépôt A
   ↓
Transfert
   ↓
Dépôt B
```

Exemple :

```text
Produit : T-shirt M
Quantité : 20

Dépôt source : Cotonou
Dépôt cible  : Calavi
```

Le système générera :

```text
Cotonou
-20

Calavi
+20
```

Les mouvements devront être liés au même transfert.

## 26.1. Workflow V1

```text
DRAFT
  ↓
COMPLETED     ← mouvement atomique source − et destination +
```

* le dépôt source et le dépôt destination doivent être distincts ;
* ils appartiennent à la même organisation ;
* le stock source doit suffire ;
* **pas d'état « en transit »** en V1 ;
* un `DRAFT` peut être annulé (`CANCELLED`) sans impact stock ;
* un transfert `COMPLETED` n'est pas modifiable ; une erreur se corrige par un transfert inverse.

Le workflow étendu (Demandé → Expédié → Reçu, stock en transit) est **hors V1**.

États :

```text
DRAFT
COMPLETED
CANCELLED
```

---

# 27. Fournisseurs

Chaque organisation pourra gérer ses fournisseurs.

Informations :

```text
Supplier
--------
id
organization_id
name
contact_name
email
phone
address
city
country
notes
is_active
```

---

# 28. Achats

Un achat permet d'enregistrer une entrée commerciale provenant d'un fournisseur.

## 28.1. Workflow

```text
Brouillon
    ↓
Confirmé
    ↓
Réception
    ↓
Stock augmenté
```

Le stock ne doit être augmenté qu'au moment où les marchandises sont réellement reçues.

## 28.2. Statuts d'achat

```text
DRAFT
CONFIRMED
PARTIALLY_RECEIVED
RECEIVED
CANCELLED
```

Transitions autorisées :

```text
DRAFT → CONFIRMED | CANCELLED
CONFIRMED → PARTIALLY_RECEIVED | RECEIVED | CANCELLED
PARTIALLY_RECEIVED → PARTIALLY_RECEIVED | RECEIVED
RECEIVED → (terminal)
CANCELLED → (terminal, uniquement si quantité déjà reçue = 0)
```

Une réception peut être **partielle**. Plusieurs réceptions successives sont autorisées jusqu'à épuisement de la quantité commandée.

```text
Commandé : 100
Reçu     : 70     → PARTIALLY_RECEIVED  (+70 en stock)
Puis     : 30     → RECEIVED            (+30 en stock)
```

On ne peut pas réceptionner plus que le reste à recevoir.

---

# 29. Achat

```text
Purchase
--------
id
organization_id
supplier_id
warehouse_id
reference
status
purchase_date
expected_date
subtotal
discount
tax
total
created_by
created_at
```

## 29.1. Lignes d'achat

```text
PurchaseItem
------------
purchase_id
product_id
quantity              commandée
quantity_received     cumul reçu (défaut 0)
unit_price
discount
tax
total
```

## 29.2. Réception

```text
PurchaseReceipt
---------------
id
purchase_id
warehouse_id
received_by
received_at
status                COMPLETED
```

```text
PurchaseReceiptItem
-------------------
receipt_id
purchase_item_id
quantity
```

Chaque ligne de réception génère un mouvement `PURCHASE` lié à `reference_type = purchase_receipt`.

---

# 30. Clients

Une organisation pourra gérer ses clients.

```text
Customer
--------
id
organization_id
name
phone
email
address
city
notes
created_at
```

La V1 devra rester simple.

L'objectif n'est pas de construire immédiatement un CRM.

---

# 31. Ventes

Une vente permet d'enregistrer une sortie commerciale.

## 31.1. Workflow V1

```text
DRAFT
    ↓
COMPLETED     ← sortie de stock atomique
    ↓
CANCELLED     ← optionnel, Owner/Admin, réintégration stock
```

## 31.2. Statuts de vente — V1

```text
DRAFT
COMPLETED
CANCELLED
```

Le statut `CONFIRMED` peut exister en base pour une évolution caisse / encaissement (V2). **Il n'est pas exposé en V1.**

La validation d'une vente `DRAFT` passe **directement** à `COMPLETED` et déclenche la sortie de stock dans **une seule transaction** :

1. verrouiller les positions de stock concernées ;
2. vérifier permissions et dépôt autorisé ;
3. vérifier le stock disponible ;
4. créer/finaliser la vente et les lignes (prix copiés du catalogue) ;
5. créer les mouvements `SALE` ;
6. mettre à jour `StockPosition` ;
7. écrire l'audit.

Si une étape échoue, tout est annulé.

Le client est **optionnel** (vente anonyme / passage).

Une vente `COMPLETED` ne se modifie pas. Owner / Admin peut l'**annuler** : statut `CANCELLED` + mouvement `SALE_CANCEL` (réintégration du stock). Manager et Staff ne le peuvent pas.

Il n'y a **pas** de suivi d'encaissement, d'acompte ou de créance client en V1.

---

# 32. Vente

```text
Sale
----
id
organization_id
customer_id          nullable
warehouse_id
reference
status               DRAFT | COMPLETED | CANCELLED
sale_date
subtotal
discount
tax
total
created_by
created_at
```

## 32.1. Lignes de vente

```text
SaleItem
--------
sale_id
product_id
quantity
unit_price
discount
tax
total
```

---

# 33. Gestion des prix

Chaque produit pourra posséder :

```text
Prix d'achat
Prix de vente
```

La plateforme pourra calculer :

```text
Marge unitaire
Marge totale
Taux de marge
```

Exemple :

```text
Prix achat : 8 000 XOF
Prix vente : 10 000 XOF

Marge : 2 000 XOF
Taux de marge commerciale : 20 %
Markup : 25 %
```

Formules **verrouillées** :

```text
Marge unitaire = prix de vente − prix d'achat

Taux de marge commerciale = marge / prix de vente × 100
(c'est l'indicateur affiché par défaut)

Markup = marge / prix d'achat × 100
(indicateur secondaire)
```

Les prix catalogue sont ceux **en vigueur pour les nouvelles opérations**. L'historique commercial conserve les montants saisis sur chaque ligne.

Si le prix d'achat catalogue est 0, le taux et le markup ne s'affichent pas (division impossible) ; la marge unitaire reste affichable si le prix de vente est connu.

## 33.1. Remises

* remise en montant **ou** en pourcentage, au niveau vente et/ou ligne ;
* Staff : 0 % ;
* Manager : plafond paramétrable (défaut 10 %) ;
* Admin / Owner : pas de plafond applicatif ;
* le total ne peut pas devenir négatif.

## 33.2. Taxes / TVA

V1 n'est pas un logiciel comptable.

* TVA **désactivée** par défaut ;
* si activée : **un** taux par organisation ;
* les prix sont TTC par défaut (`prices_include_tax = true`) ;
* la vente/l'achat stocke `subtotal`, `discount`, `tax`, `total` ;
* pas de multi-taux, pas de déclaration fiscale, pas d'export comptable.

## 33.3. Montants

Tous les montants sont stockés en **entiers** (plus petite unité de la devise).

| Devise | `currency_exponent` |
|---|---|
| XOF, XAF, GNF, CDF | 0 |
| EUR, USD | 2 |

**Interdiction** des flottants pour l'argent. L'affichage respecte le format numérique de l'organisation.

---

# 34. Gestion des inventaires

L'utilisateur pourra créer un inventaire pour un dépôt.

Workflow :

```text
Création
   ↓
Comptage
   ↓
Saisie du stock réel
   ↓
Calcul des écarts
   ↓
Validation
   ↓
Ajustement automatique
```

États :

```text
DRAFT
COUNTING
REVIEW
VALIDATED
CANCELLED
```

Règles V1 :

* **un seul** inventaire non terminal (`DRAFT`, `COUNTING`, `REVIEW`) par dépôt à la fois ;
* Staff peut compter, pas valider ;
* Manager, Admin et Owner valident ;
* la validation est atomique : écarts ≠ 0 → mouvements `INVENTORY_ADJUSTMENT` ;
* un inventaire `VALIDATED` n'est plus modifiable ;
* `CANCELLED` possible tant que non validé, sans impact stock.

---

# 35. Écart d'inventaire

Exemple :

```text
Produit       Théorique    Réel    Écart
-----------------------------------------
Produit A        100        98      -2
Produit B         50        52      +2
Produit C         20        20       0
```

Lors de la validation, les écarts génèrent des mouvements d'ajustement.

---

# 36. Alertes de stock

Le système devra détecter les produits dont le stock est inférieur ou égal au seuil minimum.

Exemple :

```text
Stock actuel : 4
Stock minimum : 10

→ Alerte
```

Types d'alertes :

* stock faible ;
* rupture ;
* éventuellement stock excessif dans une évolution future.

---

# 37. Notifications

V1 pourra prendre en charge des notifications internes.

Exemples :

```text
⚠️ Le stock de "Huile 1L" est faible.

📦 Un achat vient d'être réceptionné.

🔄 Le transfert TR-00045 a été validé.

📋 L'inventaire INV-0012 nécessite votre validation.
```

Les notifications email/SMS/WhatsApp pourront être ajoutées ultérieurement.

---

# 38. Dashboard

Le dashboard doit fournir une vue synthétique de l'activité.

Indicateurs principaux :

* nombre de produits ;
* valeur du stock ;
* stock faible ;
* ventes ;
* achats ;
* marge ;
* nombre de dépôts ;
* activité récente.

---

# 39. Statistiques

Le dashboard pourra présenter :

### Ventes

* ventes du jour ;
* semaine ;
* mois ;
* évolution.

### Achats

* achats du mois ;
* évolution.

### Stock

* valeur totale ;
* produits en rupture ;
* produits à faible stock.

### Produits

* plus vendus ;
* moins vendus.

---

# 40. Rapports

Les rapports V1 pourront inclure :

### Rapport de stock

```text
Produit
Dépôt
Quantité
Prix d'achat
Valeur
```

### Rapport de mouvements

```text
Date
Produit
Type
Quantité
Dépôt
Utilisateur
Référence
```

### Rapport de ventes

```text
Date
Référence
Client
Montant
Utilisateur
```

### Rapport d'achats

```text
Date
Référence
Fournisseur
Montant
```

### Rapport d'inventaire

```text
Produit
Stock théorique
Stock réel
Écart
```

---

# 41. Export

Les données pourront être exportées en :

* CSV ;
* Excel ;
* PDF.

Le système devra respecter les permissions de l'utilisateur lors de l'export.

---

# 42. Import de produits

Une fonctionnalité d'importation CSV/Excel est prévue dans le MVP.

Exemple :

```text
SKU
Nom
Catégorie
Prix achat
Prix vente
Stock initial
```

Workflow :

```text
Importer fichier
      ↓
Analyse
      ↓
Prévisualisation
      ↓
Détection des erreurs
      ↓
Correction
      ↓
Validation
      ↓
Import
```

Le système ne doit pas créer partiellement un catalogue si des erreurs bloquantes sont détectées, sauf si un mode d'import partiel est explicitement prévu.

---

# 43. Stock initial

Lors de la création/importation d'un produit, le stock initial devra pouvoir être renseigné pour un dépôt.

Ce stock devra être enregistré comme un mouvement `INITIAL` (jamais comme une écriture directe de `StockPosition` sans mouvement).

Quantité initiale 0 autorisée (produit créé sans stock). Le stock initial n'est possible **qu'une fois** par couple produit + dépôt ; ensuite, seules les opérations métier font varier la quantité.

---

# 43.1. Suppressions

Les ressources historiques (produits, clients, fournisseurs, dépôts, ventes, achats) ne sont **pas** supprimées physiquement si elles ont un historique.

Statuts privilégiés : `ACTIVE` / `INACTIVE` (ou `is_active`).

La suppression physique est réservée aux brouillons jamais validés (vente `DRAFT`, achat `DRAFT`, transfert `DRAFT`, inventaire non validé) et aux données sans impact d'intégrité.

---

# 44. Audit

STOCKPRO devra conserver une trace des actions importantes.

Exemple :

```text
13/09/2026
Jean

A créé :
Produit "T-shirt noir M"

13/09/2026
Paul

A validé :
Vente #V-001245

13/09/2026
Marie

A modifié :
Prix de vente du produit #245
```

---

# 45. Journal d'audit

```text
AuditLog
--------
id
organization_id
user_id
action
entity_type
entity_id
old_values
new_values
ip_address
user_agent
created_at
```

Les informations sensibles devront être protégées et les données inutiles ne devront pas être stockées.

---

# 46. Recherche

L'application devra proposer une recherche globale ou module par module.

Recherche possible par :

* nom ;
* SKU ;
* code-barres ;
* référence ;
* client ;
* fournisseur.

---

# 47. Filtres

Les tableaux devront permettre des filtres adaptés.

Exemples :

```text
Stock
├── Dépôt
├── Catégorie
├── Stock faible
└── Statut
```

```text
Ventes
├── Date
├── Client
├── Dépôt
├── Statut
└── Utilisateur
```

---

# 48. Pagination

Les listes importantes devront utiliser une pagination côté serveur.

Cela concerne notamment :

* produits ;
* ventes ;
* achats ;
* mouvements ;
* clients ;
* fournisseurs ;
* utilisateurs ;
* audit logs.

---

# 49. Interface utilisateur

L'interface devra être :

* moderne ;
* claire ;
* professionnelle ;
* responsive ;
* rapide ;
* cohérente ;
* orientée productivité.

L'objectif est d'éviter l'impression d'un ERP complexe.

---

# 50. Navigation principale

```text
Dashboard
Produits
Stock
Ventes
Achats
Clients
Fournisseurs
Inventaires
Rapports
Paramètres
```

Certaines sections pourront être masquées selon les permissions.

---

# 51. Responsive design

L'application devra fonctionner correctement sur :

### Desktop

Usage principal pour la gestion.

### Tablette

Usage intermédiaire.

### Smartphone

Usage terrain :

* consultation ;
* vente ;
* scan ;
* mouvements ;
* inventaire.

---

# 52. PWA

Une Progressive Web App pourra être envisagée afin de permettre une expérience proche d'une application mobile sans développer immédiatement une application native.

Fonctionnalités possibles :

* installation sur smartphone ;
* accès rapide ;
* interface optimisée mobile ;
* utilisation de la caméra pour les codes-barres.

Le mode offline complet pourra être étudié ultérieurement.

---

# 53. Internationalisation

Le système devra être conçu pour supporter plusieurs langues.

V1 :

```text
Français
```

Évolution :

```text
English
```

Les textes de l'interface ne devront donc pas être inutilement codés en dur dans la logique métier.

---

# 54. Devises

Chaque organisation possédera une devise principale.

Exemples :

```text
XOF
XAF
GNF
CDF
MGA
EUR
USD
```

La devise doit être associée à l'organisation et affichée selon ses paramètres.

---

# 55. Fuseaux horaires

Chaque organisation pourra définir son fuseau horaire.

Exemple :

```text
Africa/Porto-Novo
Africa/Abidjan
Africa/Dakar
Africa/Douala
```

Les dates seront stockées de manière cohérente côté backend et affichées selon le fuseau de l'organisation.

---

# 56. Paramètres de l'organisation

Le propriétaire/admin pourra configurer :

* nom ;
* logo ;
* adresse ;
* téléphone ;
* email ;
* pays ;
* devise ;
* fuseau horaire ;
* préférences de stock ;
* seuils ;
* formats de documents.

---

# 57. Documents commerciaux

À terme, les ventes et achats pourront générer :

* factures ;
* bons de commande ;
* bons de livraison ;
* reçus.

Dans le MVP, une première version simplifiée des documents de vente/achat pourra être proposée.

---

# 58. Architecture technique

## Backend

```text
Python
Django
Django REST Framework
PostgreSQL
JWT
```

Extensions potentielles :

```text
Redis
Celery
```

pour :

* notifications ;
* génération de rapports ;
* tâches planifiées ;
* traitement de fichiers.

---

# 59. Architecture frontend

```text
React
Vite
TypeScript
Tailwind CSS
shadcn/ui
```

La plateforme frontend communiquera avec le backend via API REST.

---

# 60. Structure backend proposée

```text
backend/
│
├── config/
│
├── apps/
│   ├── accounts/
│   ├── organizations/
│   ├── subscriptions/
│   ├── products/
│   ├── inventory/
│   ├── purchases/
│   ├── sales/
│   ├── customers/
│   ├── suppliers/
│   ├── reports/
│   ├── notifications/
│   └── audit/
│
├── manage.py
└── requirements.txt
```

---

# 61. Structure frontend proposée

```text
frontend/
│
├── src/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── purchases/
│   │   ├── sales/
│   │   ├── customers/
│   │   ├── suppliers/
│   │   └── reports/
│   │
│   ├── services/
│   ├── hooks/
│   ├── stores/
│   ├── router/
│   └── types/
│
└── ...
```

---

# 62. API REST

Exemples :

```text
/api/auth/
/api/organizations/
/api/users/
/api/products/
/api/categories/
/api/warehouses/
/api/stock/
/api/movements/
/api/transfers/
/api/purchases/
/api/sales/
/api/customers/
/api/suppliers/
/api/inventories/
/api/reports/
```

Toutes les ressources métier devront être protégées par l'isolation de l'organisation.

---

# 63. Règles fondamentales du multi-tenant

Chaque requête métier devra respecter :

```text
Utilisateur
    ↓
Organisation active
    ↓
Permissions
    ↓
Ressource appartenant à l'organisation
```

Il devra être impossible de contourner cette logique simplement en modifiant :

* un ID ;
* une URL ;
* un paramètre ;
* un payload JSON.

---

# 64. Sécurité

Mesures prévues :

* HTTPS obligatoire en production ;
* mots de passe hashés ;
* JWT sécurisé ;
* expiration des tokens ;
* permissions backend ;
* validation des données ;
* protection contre l'accès inter-tenant ;
* protection CSRF lorsque pertinente ;
* limitation des requêtes sensibles ;
* contrôle des uploads (types MIME, taille, pas d'exécution) ;
* journalisation des opérations critiques ;
* sauvegardes ;
* gestion sécurisée des secrets ;
* rate limiting sur login et reset mot de passe ;
* idempotence des validations d'opérations.

## 64.1. Uploads

* logo d'organisation et image produit ;
* formats : JPEG, PNG, WebP ;
* taille maximale : 2 Mo ;
* stockage local en développement, objet (S3 compatible) en production ;
* les fichiers sont scannés / servis hors du code applicatif ; les noms générés côté serveur.

## 64.2. Idempotence

Les endpoints de **validation** (vente, réception, transfert, inventaire) acceptent un en-tête `Idempotency-Key`.

* clé unique par organisation, conservée 24 h ;
* rejeu avec la même clé + même payload → même résultat, sans double mouvement ;
* même clé + payload différent → `IDEMPOTENCY_CONFLICT`.

Cela protège contre le double clic et les réseaux instables.

---

# 65. Transactions de base de données

Les opérations critiques devront être atomiques.

Exemple lors d'une vente :

```text
Début transaction
      ↓
SELECT … FOR UPDATE sur les StockPosition
      ↓
Vérification stock
      ↓
Création / finalisation vente + lignes
      ↓
Création mouvements
      ↓
Mise à jour StockPosition
      ↓
Audit
      ↓
Commit
```

Si une étape échoue :

> l'ensemble de l'opération doit être annulé.

Cela devra être géré via les transactions PostgreSQL/Django.

Le même schéma s'applique à : réception d'achat, transfert, validation d'inventaire, annulation de vente.

---

# 66. Règle fondamentale du stock

Le système doit empêcher autant que possible :

```text
Stock négatif
```

Une configuration pourra éventuellement permettre le stock négatif dans une évolution future pour certains secteurs.

V1 :

> stock négatif **interdit**. Pas d'option de configuration en V1.

Une configuration « autoriser le négatif » pourra être étudiée plus tard pour certains secteurs. Elle n'existe pas dans le MVP.

---

# 67. Gestion de la concurrence

Le système devra tenir compte des opérations simultanées.

Exemple :

Deux vendeurs tentent simultanément de vendre les dernières unités disponibles.

Le backend doit éviter que les deux ventes soient validées alors qu'une seule est possible.

## 67.1. Mécanisme obligatoire V1

Sur chaque position impactée :

1. `SELECT … FROM stock_position WHERE … FOR UPDATE` ;
2. si la ligne n'existe pas : la créer à quantité 0, puis la verrouiller ;
3. refuser l'opération si `quantity < demandé` ;
4. écrire mouvement + nouvelle quantité **dans la même transaction**.

Le niveau d'isolation recommandé est celui des transactions Django par défaut, avec verrouillage explicite des lignes de position. Un `unique (organization_id, product_id, warehouse_id)` empêche les doublons de position.

Les tests doivent couvrir deux validations concurrentes sur la dernière unité : **une seule** réussit.

---

# 68. Architecture SaaS

Le système devra distinguer :

```text
Plateforme
     │
     ├── Organisations
     │
     ├── Plans
     │
     ├── Abonnements
     │
     └── Configuration globale
```

Et :

```text
Organisation
     │
     ├── Users
     ├── Products
     ├── Warehouses
     ├── Stock
     ├── Sales
     └── Purchases
```

---

# 69. Plans SaaS

L'architecture devra être prête pour plusieurs plans.

Exemple provisoire :

### Free

* 1 utilisateur ;
* 1 dépôt ;
* catalogue limité.

### Starter

* plusieurs utilisateurs ;
* plusieurs dépôts ;
* catalogue plus important.

### Business

* davantage d'utilisateurs ;
* davantage de dépôts ;
* rapports avancés.

### Enterprise

* limites personnalisées ;
* fonctionnalités avancées ;
* support prioritaire.

Les limites exactes seront déterminées lors de la phase commerciale.

---

# 70. Gestion des fonctionnalités par abonnement

Le système devra pouvoir contrôler :

```text
max_users
max_products
max_warehouses
max_storage
```

ainsi que des fonctionnalités :

```text
advanced_reports
excel_import
barcode
multi_warehouse
audit
api_access
```

L'objectif est d'éviter de coder les limites directement dans chaque module.

---

# 71. Paiement des abonnements

Le paiement en ligne n'est pas une priorité technique du premier MVP.

Pendant le **pilote**, l'activation / le renouvellement peut être **manuel** (équipe STOCKPRO, back-office ou tableur). L'architecture devra cependant permettre une intégration future avec des solutions adaptées aux marchés africains :

* Mobile Money ;
* cartes bancaires ;
* agrégateurs de paiement ;
* autres prestataires locaux/internationaux.

Une période d'essai (`TRIAL`) est prévue au niveau organisation (dates début/fin). Les règles d'expiration exactes (blocage vs lecture seule) seront fixées avec l'offre commerciale ; par défaut après expiration : passage en `SUSPENDED` (connexion owner possible pour régulariser, opérations métier bloquées).

---

# 72. Administration SaaS

Un back-office réservé à l'équipe STOCKPRO pourra être développé.

Il permettra de gérer :

* organisations ;
* utilisateurs ;
* abonnements ;
* plans ;
* statistiques globales ;
* incidents ;
* support ;
* paramètres globaux.

Ce back-office sera distinct de l'espace client.

---

# 73. Monitoring

La production devra prévoir :

* logs applicatifs ;
* surveillance des erreurs ;
* monitoring serveur ;
* monitoring base de données ;
* alertes ;
* suivi des performances.

---

# 74. Sauvegardes

Les données PostgreSQL devront être sauvegardées régulièrement.

Stratégie cible :

```text
Backup automatique
       ↓
Stockage séparé
       ↓
Rétention
       ↓
Tests périodiques de restauration
```

---

# 75. Tests

Le projet devra disposer de tests automatisés.

## Backend

Tests :

* modèles ;
* permissions ;
* API ;
* isolation multi-tenant ;
* stock ;
* ventes ;
* achats ;
* inventaires ;
* transactions.

## Frontend

Tests :

* composants critiques ;
* formulaires ;
* workflows ;
* permissions d'affichage.

## Tests d'intégration

Tester les workflows complets :

```text
Achat → Réception → Stock

Vente → Validation → Sortie

Transfert → Sortie dépôt A → Entrée dépôt B

Inventaire → Écart → Ajustement
```

---

# 76. Critères de qualité

Le produit devra respecter :

* code propre ;
* documentation ;
* conventions de développement ;
* migrations versionnées ;
* variables d'environnement ;
* gestion correcte des erreurs ;
* logs ;
* tests ;
* validation des entrées ;
* absence de données sensibles dans les logs.

## 76.1. Cadre légal (à préciser avec un conseil)

Le produit collectera des données d'entreprises et d'utilisateurs (identité, email, téléphone, opérations commerciales). Avant production :

* CGU et politique de confidentialité ;
* localisation et sous-traitance de l'hébergement ;
* conformité à étudier pour le Bénin et les pays d'expansion (données personnelles).

Ce n'est pas un livrable du code MVP, mais un prérequis de mise en production réelle.

---

# 77. Périmètre livrable

## 77.1. MVP pilote (P0 + P1) — première mise en boutique

Objectif : un commerçant au Bénin gère catalogue, stock, achats et ventes **sans** Excel, inventaire guidé ni rapports PDF.

### Authentification et organisation

* inscription, connexion, récupération de mot de passe ;
* JWT access/refresh ;
* création d'organisation, premier dépôt, paramètres (pays, devise, fuseau) ;
* membership, invitation, 4 rôles, accès par dépôt.

### Catalogue

* catégories plates ;
* produits simples (CRUD, SKU, code-barres saisi, prix, seuil min, image optionnelle) ;
* **pas** d'UI variantes ;
* **pas** d'import Excel.

### Stock

* positions par produit × dépôt ;
* mouvements (INITIAL, PURCHASE, SALE, SALE_CANCEL, TRANSFER_*) ;
* transferts atomiques ;
* stock négatif interdit ;
* verrouillage concurrent.

### Commerce

* fournisseurs, achats, réception **y compris partielle** ;
* clients simples, ventes (brouillon → terminée), remises selon rôle ;
* TVA optionnelle (un taux).

### Pilotage minimal

* dashboard : ventes du jour, stock faible / rupture, valeur de stock, activité récente ;
* historique des mouvements d'un produit.

### Qualité

* isolation multi-tenant testée ;
* responsive desktop + smartphone utilisable pour la vente ;
* audit des validations (vente, réception, transfert).

## 77.2. V1 commerciale (MVP pilote + P2)

* inventaires complets (comptage, écarts, validation) ;
* alertes de stock dans l'application ;
* rapports stock / ventes / achats / mouvements / inventaires ;
* export CSV ;
* dashboard enrichi (périodes, top produits, marges) ;
* audit consultable dans l'UI.

## 77.3. V1.1 — productivité (P3)

* import CSV/Excel produits (prévisualisation, rejet global si erreurs bloquantes) ;
* export Excel / PDF ;
* scan code-barres caméra (PWA) ;
* installation PWA.

---

# 78. Fonctionnalités hors V1

Les fonctionnalités suivantes ne bloquent ni le MVP pilote ni la V1 :

* UI des variantes produits (le modèle est prévu) ;
* réservation de stock sur brouillon ;
* transfert avec transit / réception différée ;
* encaissement, caisse, crédit / dettes clients ;
* conversion d'unités (carton ↔ pièce) ;
* catégories hiérarchiques (UI) ;
* switcher multi-organisations ;
* ajustement de stock manuel libre ;
* application mobile native ;
* mode offline complet ;
* comptabilité ;
* gestion avancée des lots, n° de série, dates d'expiration ;
* fidélité ;
* CRM avancé ;
* API publique ;
* intégrations e-commerce (WooCommerce, Shopify, marketplaces) ;
* notifications email / SMS / WhatsApp / push ;
* IA, prévisions, recommandations ;
* multi-devises avancées ;
* marketplace fournisseurs ;
* paiement d'abonnement en ligne ;
* site marketing (landing, tarifs) dans la même application — à séparer du SaaS.

---

# 79. Roadmap proposée

## Phase 0 — Conception

* cahier des charges v1.1 ;
* architecture fonctionnelle ;
* ERD / modèle PostgreSQL ;
* wireframes ;
* backlog MVP.

## Phase 1 — Fondation (P0)

* projet Django + PostgreSQL ;
* JWT ;
* organisations ;
* membership, invitations, rôles, permissions ;
* isolation `organization_id` + tests IDOR ;
* dépôts.

## Phase 2 — Catalogue (P1)

* catégories plates ;
* produits simples ;
* SKU / code-barres (saisie) ;
* stock initial `INITIAL`.

## Phase 3 — Stock (P1)

* `StockPosition` + `StockMovement` ;
* concurrence `FOR UPDATE` ;
* transferts atomiques ;
* historique produit.

## Phase 4 — Commerce (P1)

* fournisseurs / achats / réceptions partielles ;
* clients / ventes ;
* remises / TVA optionnelle ;
* dashboard minimal.

## Phase 5 — Contrôle (P2)

* inventaires ;
* alertes ;
* rapports + export CSV ;
* audit UI.

## Phase 6 — Productivité (P3)

* import Excel ;
* exports Excel/PDF ;
* PWA / scan caméra.

## Phase 7 — SaaS (P4)

* plans, trial, limitations ;
* back-office plateforme ;
* paiement (après le pilote).

## Phase 8 — Production

* déploiement ;
* monitoring ;
* backups + test de restauration ;
* sécurité ;
* optimisation.

Les **variantes produits** ne sont plus dans la phase catalogue V1 ; elles rejoignent la V2.

---

# 80. V2 potentielle

Après validation du MVP :

```text
STOCKPRO V2
│
├── POS
├── Mobile/PWA avancée
├── QR / Barcode avancé
├── Notifications
├── Facturation
├── Gestion des lots
├── Numéros de série
├── Expiration
├── API
├── WooCommerce
└── E-commerce
```

---

# 81. V3 potentielle — Intelligence

STOCKPRO pourrait évoluer vers une plateforme intelligente :

### Prévision

> « Votre stock de chaussures taille 42 risque d'être épuisé dans environ 8 jours. »

### Recommandation

> « Nous vous recommandons de commander 50 unités. »

### Analyse

> « Les ventes de ce produit ont augmenté de 23 % ce mois-ci. »

### Détection

> « Une différence inhabituelle apparaît dans les mouvements du dépôt. »

L'IA sera ajoutée uniquement lorsque suffisamment de données fiables seront disponibles.

---

# 82. KPIs produit

Les indicateurs de succès de STOCKPRO pourront inclure :

### Acquisition

* organisations créées ;
* taux de conversion inscription → activation.

### Activation

* produits créés ;
* premier dépôt créé ;
* première vente ;
* premier achat ;
* premier inventaire.

### Engagement

* utilisateurs actifs ;
* organisations actives ;
* opérations par organisation.

### Rétention

* organisations actives après 7 jours ;
* 30 jours ;
* 90 jours.

### Business

* nombre d'abonnés payants ;
* MRR ;
* ARR ;
* churn ;
* ARPU.

---

# 83. Critères de réussite du MVP pilote

Le MVP pilote est fonctionnel lorsqu'une entreprise peut, **sans import Excel et sans module inventaire**, faire ceci sans aide technique :

```text
Créer un compte
      ↓
Créer son organisation
      ↓
Créer un dépôt
      ↓
Créer ses produits (saisie)
      ↓
Initialiser le stock (mouvement INITIAL)
      ↓
Inviter un utilisateur Staff
      ↓
Créer un fournisseur
      ↓
Enregistrer un achat
      ↓
Réceptionner (y compris partiellement)
      ↓
Voir le stock augmenter
      ↓
Créer un client
      ↓
Effectuer une vente
      ↓
Voir le stock diminuer
      ↓
Tenter une vente au-delà du stock → refus clair
      ↓
Transférer vers un second dépôt (si créé)
      ↓
Consulter l'historique des mouvements
      ↓
Voir le dashboard minimal
```

Un utilisateur de l'organisation A ne voit aucune donnée de B (404).

La **V1 commerciale** ajoute : inventaire validé avec écarts, rapports, alertes.

---

# 84. Critère critique de sécurité

Le test suivant doit toujours réussir :

```text
Organisation A
      ❌
      │
      │ accès impossible
      ▼
Organisation B
```

Aucune API, aucun endpoint, aucune page et aucune fonctionnalité ne doit permettre à un utilisateur de consulter ou modifier les données d'une autre organisation.

Une tentative par ID, URL ou payload doit aboutir à **404**.

---

# 85. Principe directeur du projet

STOCKPRO ne doit pas être développé comme :

> « une collection de CRUD ».

Il doit être développé comme :

> **un système de gestion d'événements commerciaux et de stock.**

Le stock doit être la conséquence des opérations.

```text
ACHAT
  ↓
ENTRÉE

VENTE
  ↓
SORTIE

TRANSFERT
  ↓
SORTIE + ENTRÉE

INVENTAIRE
  ↓
AJUSTEMENT
```

Cette philosophie constitue l'un des fondements techniques du projet.

---

# 86. Résultat attendu

À la fin du développement du MVP, STOCKPRO devra être une plateforme SaaS permettant à une PME commerciale de :

> **centraliser ses produits, gérer ses stocks, suivre ses achats et ventes, gérer plusieurs dépôts, contrôler ses utilisateurs, réaliser ses inventaires et analyser son activité depuis une seule interface.**

Le système devra être suffisamment robuste pour accueillir plusieurs organisations indépendantes et suffisamment modulaire pour évoluer progressivement vers une plateforme complète de gestion commerciale.

---

# 87. Résumé de l'architecture cible

```text
                         STOCKPRO SaaS
                              │
                 ┌────────────┴────────────┐
                 │                         │
             Frontend                  Backend
             React                     Django
             Vite                      DRF
             TypeScript                   │
                 │                        │
                 └────────── API ─────────┘
                              │
                         PostgreSQL
                              │
             ┌────────────────┼────────────────┐
             │                │                │
        Organization       Users          Subscription
             │
      ┌──────┼────────┬─────────┬─────────┐
      │      │        │         │         │
   Products Stock   Purchases Sales   Inventory
      │      │        │         │         │
      └──────┴────────┴─────────┴─────────┘
                       │
                    Audit
```

---

# 88. Conclusion

STOCKPRO est conçu comme un **SaaS B2B multi-tenant**, et non comme une application de gestion de stock isolée.

La première version se concentre sur les besoins essentiels des commerces et boutiques d'Afrique francophone :

**Produits → Dépôts → Stock → Achats → Ventes → Inventaires → Rapports → Contrôle.**

L'architecture doit cependant anticiper les évolutions futures afin de permettre l'intégration progressive de :

* plusieurs modèles d'abonnement ;
* paiements ;
* applications mobiles ;
* e-commerce ;
* API ;
* automatisations ;
* IA ;
* fonctionnalités avancées de gestion commerciale.

Le principe fondamental reste :

> **Simple pour le commerçant. Solide techniquement. Sécurisé par organisation. Évolutif comme SaaS.**

---

## Documents suivants recommandés

L'architecture fonctionnelle détaillée existe. Prochaines étapes, dans l'ordre :

**1. Diagramme ERD complet** (contraintes, unicités, `organization_id`)
**2. Modèle de données PostgreSQL / modèles Django**
**3. Contrats API REST** (ressources, transitions d'état, erreurs)
**4. Architecture React** (features, stores, garde permissions)
**5. Wireframes desktop + mobile** (vente, réception, stock)
**6. Backlog MVP pilote découpé en tickets de développement**
