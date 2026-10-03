from drf_spectacular.extensions import OpenApiAuthenticationExtension
from drf_spectacular.openapi import AutoSchema


class TenantJWTScheme(OpenApiAuthenticationExtension):
    target_class = "apps.accounts.authentication.TenantJWTAuthentication"
    name = "bearerAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": (
                "Jeton d'accès JWT. Obtenez-le via POST /api/auth/login/ ou /api/auth/register/, "
                "puis cliquez sur Authorize et collez uniquement le token (sans le mot Bearer)."
            ),
        }


class TaggedAutoSchema(AutoSchema):
    PATH_TAGS = (
        ("/api/auth/", "Authentification"),
        ("/api/users/", "Utilisateurs"),
        ("/api/invitations/", "Utilisateurs"),
        ("/api/organizations/", "Organisation"),
        ("/api/dashboard/", "Dashboard"),
        ("/api/categories/", "Catalogue"),
        ("/api/products/", "Catalogue"),
        ("/api/warehouses/", "Stock"),
        ("/api/stock/", "Stock"),
        ("/api/movements/", "Stock"),
        ("/api/transfers/", "Stock"),
        ("/api/customers/", "Clients"),
        ("/api/suppliers/", "Fournisseurs"),
        ("/api/purchases/", "Achats"),
        ("/api/sales/", "Ventes"),
        ("/api/health/", "Système"),
    )

    def get_tags(self):
        path = self.path or ""
        for prefix, tag in self.PATH_TAGS:
            if path.startswith(prefix):
                return [tag]
        return super().get_tags()
