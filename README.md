# STOCKPRO

SaaS B2B multi-tenant de gestion commerciale (produits, stock, achats, ventes) pour les commerces d’Afrique francophone.

Le stock n’est jamais modifié à la main : il est la conséquence des opérations (achat, vente, transfert, stock initial).

## Stack

Backend : Python 3.12, Django 5.2, Django REST Framework, JWT, PostgreSQL.

La documentation interactive est fournie par **Swagger UI** (OpenAPI 3).

## Démarrage local

### 1. Base de données

```bash
docker compose up -d
cp .env.example .env
```

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

| URL | Usage |
|---|---|
| http://127.0.0.1:8000/api/docs/ | Swagger UI |
| http://127.0.0.1:8000/api/redoc/ | ReDoc |
| http://127.0.0.1:8000/api/schema/ | Schéma OpenAPI (YAML/JSON) |
| http://127.0.0.1:8000/api/health/ | Santé du service |

### Essayer l’API dans Swagger

1. Ouvrir `/api/docs/`.
2. `POST /api/auth/register/` (ou `/api/auth/login/`) — récupérer `access`.
3. Cliquer sur **Authorize**, coller le jeton (sans `Bearer`).
4. Les routes métier (produits, stock, ventes, etc.) utilisent alors l’organisation du token.

## Tests

```bash
cd backend
source .venv/bin/activate
python manage.py test
```

Les tests couvrent l’isolation multi-tenant, la sortie de stock à la validation d’une vente, le refus de stock insuffisant, et la réception partielle d’achat.

## Périmètre actuellement livré (MVP pilote)

- Inscription / connexion JWT
- Organisation + membership + rôles
- Dépôts, produits, stock, mouvements
- Achats (confirmés + réception, y compris partielle)
- Ventes (brouillon → terminée, stock atomique)
- Dashboard
- Isolation `organization_id` (404 inter-tenant)
- Documentation OpenAPI / Swagger

Pas encore : frontend, inventaires guidés, import Excel, scan caméra, plans payants.
