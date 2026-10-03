# STOCKPRO — SaaS B2B de Gestion Commerciale & Logistique

[![CI Pipeline](https://github.com/Migyaba/stockpro/actions/workflows/ci.yml/badge.svg)](https://github.com/Migyaba/stockpro/actions/workflows/ci.yml)
[![Python Version](https://img.shields.io/badge/Python-3.12-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![Django Version](https://img.shields.io/badge/Django-5.2-092E20.svg?logo=django&logoColor=white)](https://djangoproject.com)
[![Next.js Version](https://img.shields.io/badge/Next.js-16%20App%20Router-000000.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?logo=postgresql&logoColor=white)](https://postgresql.org)
[![MinIO Storage](https://img.shields.io/badge/MinIO-S3%20Compatible-C72C48.svg?logo=minio&logoColor=white)](https://min.io)
[![Docker Ready](https://img.shields.io/badge/Docker-Production%20Ready-2496ED.svg?logo=docker&logoColor=white)](https://docker.com)

---

## 📑 Sommaire

1. [Présentation du Projet](#-présentation-du-projet)
2. [Principes Clés de Conception](#-principes-clés-de-conception)
3. [Modules Fonctionnels](#-modules-fonctionnels)
4. [Architecture Technique & Stack](#-architecture-technique--stack)
5. [Arborescence du Monorepo](#-arborescence-du-monorepo)
6. [Démarrage en Développement](#-démarrage-en-développement)
7. [Déploiement en Production](#-déploiement-en-production)
8. [Documentation des APIs (OpenAPI)](#-documentation-des-apis-openapi)
9. [Tests & Intégrité](#-tests--intégrité)
10. [Feuille de Route (Roadmap)](#-feuille-de-route-roadmap)

---

## 🎯 Présentation du Projet

**STOCKPRO** est une solution logicielle en mode **SaaS B2B multi-tenant**, conçue pour apporter une **source unique de vérité** opérationnelle et comptable aux commerces, distributeurs et PME commerciales.

### Contexte & Problématique
En Afrique subsaharienne et francophone, la gestion commerciale souffre fréquemment d'outils disparates et non synchronisés :
- Feuilles de calcul locales et carnets manuscrits sujets aux pertes de données.
- Absence de visibilité en temps réel sur les stocks consolidés multi-dépôts.
- Difficulté à calculer avec exactitude les marges brutes et les niveaux de rentabilité.
- Ruptures imprévues de stocks critiques ou surstocks coûteux.
- Absence d'historique inviolable lors des mouvements de marchandises entre dépôts.

STOCKPRO centralise dans une interface moderne l'intégralité du cycle de vie logistique : **approvisionnements, inventaires, transferts de dépôts, ventes au comptoir et facturation**.

---

## 💡 Principes Clés de Conception

### 1. Immuabilité et Traçabilité Intégrale du Stock
> **Le stock n'est jamais modifié manuellement.**

Aucune valeur de stock ne peut être écrasée par une simple saisie. La position d'un produit dans un dépôt (`StockPosition`) est la **conséquence mathématique et stricte** d'événements métier horodatés (`StockMovement`) :
- **Stock Initial** : Saisi à la création de l'article avec référence d'origine.
- **Entrée par Réception d'Achat** : Validée lors de la réception totale ou échelonnée d'un bon de commande fournisseur.
- **Sortie par Vente** : Décrémentée avec **verrouillage transactionnel pessimiste** (`select_for_update`) à la finalisation de la commande pour éliminer tout risque de survente simultanée.
- **Transferts Inter-Dépôts** : Débit atomique du dépôt émetteur et crédit du dépôt récepteur.
- **Ajustements d'Inventaire** : Correction motivée et signée lors des comptages physiques périodiques.

### 2. Multi-Tenancy Étanche
- Chaque organisation cliente possède son espace de données totalement isolé (`organization_id`).
- Le contexte locataire est injecté et validé dynamiquement via des contextes d'exécution sécurisés (`contextvars`).
- Toute tentative d'accès à une ressource appartenant à une organisation tierce renvoie un code standard **404 Not Found** (anti-énumération).

### 3. Précision Financière Sans Flottants
- Les devises sans subdivision décimale (ex : **Franc CFA - XOF**) comme les devises décimales (EUR, USD) sont gérées à l'aide de valeurs entières (`BigIntegerField`) et d'un exposant monétaire par organisation (`currency_exponent`).
- Les taxes (TVA) sont calculées en **points de base (bps)** (ex : 1800 bps = 18,00%) pour supprimer définitivement les erreurs d'arrondi inhérentes aux nombres à virgule flottante.

---

## 📦 Modules Fonctionnels

| Module | Fonctionnalités Clés |
|---|---|
| **Catalogue & Produits** | Produits simples et variantes (taille, couleur), arborescence de catégories, SKU et codes-barres uniques par entreprise, seuils d'alerte (minimum et maximum). |
| **Gestion des Stocks** | Positions en temps réel par dépôt, journal immuable des flux logistiques, alertes de réapprovisionnement, transferts inter-magasins avec contrôle d'états. |
| **Cycle des Achats** | Gestion des fournisseurs, création de commandes d'approvisionnement, réceptions partielles ou complètes avec mise à jour automatisée des positions. |
| **Cycle des Ventes** | Commandes clients, facturation, remises, calcul des taxes (TTC/HT), validation atomique et génération de l'historique de vente. |
| **Tiers & Contacts** | Répertoire centralisé des clients et des fournisseurs, suivi des coordonnées et historique complet des transactions associées. |
| **Sécurité & Rôles (RBAC)** | Matrice fine d'autorisations (Propriétaire, Administrateur, Gérant, Magasinier, Caissier, Collaborateur). |

---

## 🛠 Architecture Technique & Stack

Le système adopte une séparation stricte des responsabilités (découplage Front/Back) :

```text
                        ┌───────────────────────────────┐
                        │   Navigateur Web & Mobile    │
                        └───────────────┬───────────────┘
                                        │ (HTTP / HTTPS)
                                        ▼
                        ┌───────────────────────────────┐
                        │     Nginx (Reverse Proxy)     │
                        │    Cache, Gzip, SSL, WAF      │
                        └───────┬───────────────┬───────┘
          /api/*, /admin/*      │               │  Toutes les autres routes
       (et médias /media/*)     │               │
                                ▼               ▼
                 ┌────────────────────┐   ┌────────────────────┐
                 │  Django REST (WSGI)│   │ Next.js Standalone │
                 │  Gunicorn Cluster  │   │  Node.js (SSR/CSR) │
                 └─────────┬──────────┘   └────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
  ┌────────────────────┐       ┌────────────────────┐
  │ PostgreSQL 16 (DB) │       │ MinIO Storage (S3) │
  │ Transactions ACID  │       │  Photos & Fichiers │
  └────────────────────┘       └────────────────────┘
```

- **Backend** : Python 3.12, Django 5.2, Django REST Framework, SimpleJWT, Gunicorn.
- **Frontend** : Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Radix UI.
- **État & Données** : TanStack Query v5 (React Query), Zustand (store persistant), TanStack Table v9.
- **Persistance Relationnelle** : PostgreSQL 16 Alpine.
- **Stockage Objets** : MinIO (API compatible AWS S3) pour externaliser les photos de produits et assets.
- **Conteneurisation** : Docker & Docker Compose (environnements scellés pour dev et prod).

---

## 📁 Arborescence du Monorepo

```text
StockPro/
├── backend/                       # Service Backend & API REST
│   ├── apps/
│   │   ├── accounts/              # Utilisateurs, authentification & permissions
│   │   ├── organizations/         # Paramètres du locataire (devise, TVA)
│   │   ├── products/              # Modèles articles, variantes & catégories
│   │   ├── inventory/             # Dépôts, stocks, mouvements & transferts
│   │   ├── purchases/             # Commandes d'achats & réceptions
│   │   ├── sales/                 # Ventes, déstockage & factures
│   │   ├── customers/             # Fiches clients
│   │   ├── suppliers/             # Fiches fournisseurs
│   │   ├── audit/                 # Traçabilité des actions
│   │   └── core/                  # Tenancy, exceptions & middleware
│   ├── config/                    # Réglages Django, urls et wsgi/asgi
│   ├── Dockerfile                 # Image de développement
│   ├── Dockerfile.prod            # Image de production (Gunicorn, non-root)
│   └── entrypoint.prod.sh         # Script de migration & collectstatic
├── frontend/                      # Service Frontend Next.js
│   ├── src/
│   │   ├── app/                   # Pages et routes App Router
│   │   │   ├── (auth)/            # Authentification (login, inscription)
│   │   │   └── (app)/             # Tableaux de bord, stock, ventes, achats...
│   │   ├── components/            # Composants réutilisables (UI & formulaires)
│   │   ├── lib/                   # Clients d'API, stores Zustand, helpers
│   │   └── providers/             # Contexte React Query & hydratation
│   ├── Dockerfile                 # Image de développement
│   └── Dockerfile.prod            # Image de production (multi-stage standalone)
├── nginx/
│   └── nginx.conf                 # Configuration reverse proxy & routage
├── docker-compose.yml             # Orchestration du développement local
├── docker-compose.prod.yml        # Orchestration de production complète
├── .env.example                   # Modèle de variables pour le développement
├── .env.prod.example              # Modèle de variables pour la production
└── .github/workflows/ci.yml       # Intégration continue (Tests & Build)
```

---

## 💻 Démarrage en Développement

### 1. Prérequis
- [Docker Engine](https://docs.docker.com/engine/install/) et [Docker Compose](https://docs.docker.com/compose/)
- *(Optionnel en cas de dev hors conteneur)* : Node.js 20+, Python 3.12+, PostgreSQL local

### 2. Lancement avec Docker Compose
Le moyen le plus simple d'exécuter l'ensemble de la suite applicative :

```bash
# Copier le fichier d'environnement modèle
cp .env.example .env

# Lancer la base de données, l'API et le frontend
docker compose up -d

# Consulter les journaux en direct
docker compose logs -f
```

L'application est immédiatement disponible sur :
- **Application Frontend** : `http://localhost:3000`
- **API Swagger UI** : `http://localhost:8000/api/docs/`
- **ReDoc Interactive** : `http://localhost:8000/api/redoc/`
- **Endpoint de Santé** : `http://localhost:8000/api/health/`

---

## 🏭 Déploiement en Production

La configuration de production intègre **Gunicorn**, la compilation **Next.js Standalone**, **Nginx** et **MinIO** pour une résilience maximale :

### 1. Configuration des variables
Créez votre fichier de configuration de production :
```bash
cp .env.prod.example .env.prod
```
Renseignez dans `.env.prod` des clés robustes (mots de passe de base de données, secret Django, clés d'administration MinIO, et noms de domaine autorisés).

### 2. Déploiement de la pile
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 3. Fonctionnement de la pile en production
- **Nginx (Port 80 / 443)** : Point d'accès unique. Il compresse les flux (Gzip), met en cache les assets statiques et transmet les requêtes API à Django et le reste au serveur Node Next.js.
- **Isolation Réseau** : La base de données PostgreSQL et les moteurs d'application ne sont pas exposés sur Internet, mais confinés au réseau Docker interne sécurisé.
- **MinIO Console** : Accessible sur le port `9001` pour monitorer et administrer les buckets de stockage S3.

---

## 📡 Documentation des APIs (OpenAPI)

L'API est documentée selon la norme **OpenAPI 3.0** via `drf-spectacular` :

### Utilisation de l'API
1. Créez un compte ou connectez-vous via `POST /api/auth/login/` ou `POST /api/auth/register/`.
2. Récupérez le jeton `access` dans la réponse JSON.
3. Renseignez l'en-tête HTTP dans vos requêtes :
   ```http
   Authorization: Bearer <votre_jeton_jwt>
   ```
4. Toutes les requêtes sont automatiquement filtrées sur le périmètre de l'organisation attachée au compte utilisateur.

---

## 🧪 Tests & Intégrité

Une suite de tests automatisés valide la cohérence des opérations critiques (isolation des données, verrous de stock, gestion des réceptions partielles) :

```bash
# Exécution des tests backend
cd backend
python manage.py test apps
```

Le pipeline d'intégration continue GitHub Actions ([ci.yml](.github/workflows/ci.yml)) exécute automatiquement cette suite de tests ainsi que la validation de compilation du frontend à chaque `push` ou `pull request`.

---

## 🗺️ Feuille de Route (Roadmap)

- [x] Architecture multi-tenant avec isolation `ContextVar`
- [x] Moteur de stock immuable et transactions atomiques
- [x] Gestion des achats avec réception partielle
- [x] Interface utilisateur Next.js 16 responsive
- [x] Stockage média compatible S3 avec MinIO
- [x] Pipeline CI/CD et images Docker de production
- [ ] Module d'inventaire physique guidé avec calcul des écarts
- [ ] Impression de tickets de caisse thermique (format 80mm / 58mm) et factures PDF
- [ ] Module d'import/export de masse (catalogues Excel / CSV)
- [ ] Scan de codes-barres par caméra mobile et douchette USB
- [ ] Module de facturation électronique normalisée

---

## 📄 Licence

Ce logiciel est sous licence propriétaire. Tous droits réservés.
