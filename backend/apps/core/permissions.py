from rest_framework.permissions import BasePermission

ROLE_PERMISSIONS = {
    "OWNER": {
        "products.view",
        "products.create",
        "products.update",
        "products.deactivate",
        "stock.view",
        "stock.transfer",
        "purchases.view",
        "purchases.create",
        "purchases.confirm",
        "purchases.receive",
        "sales.view",
        "sales.create",
        "sales.validate",
        "sales.cancel",
        "inventory.view",
        "inventory.create",
        "inventory.count",
        "inventory.validate",
        "reports.view",
        "reports.export",
        "users.view",
        "users.invite",
        "users.update",
        "users.deactivate",
        "settings.view",
        "settings.update",
        "billing.manage",
        "audit.view",
        "prices.view_cost",
        "prices.update",
    },
    "ADMINISTRATOR": {
        "products.view",
        "products.create",
        "products.update",
        "products.deactivate",
        "stock.view",
        "stock.transfer",
        "purchases.view",
        "purchases.create",
        "purchases.confirm",
        "purchases.receive",
        "sales.view",
        "sales.create",
        "sales.validate",
        "sales.cancel",
        "inventory.view",
        "inventory.create",
        "inventory.count",
        "inventory.validate",
        "reports.view",
        "reports.export",
        "users.view",
        "users.invite",
        "users.update",
        "users.deactivate",
        "settings.view",
        "settings.update",
        "audit.view",
        "prices.view_cost",
        "prices.update",
    },
    "MANAGER": {
        "products.view",
        "products.create",
        "products.update",
        "products.deactivate",
        "stock.view",
        "stock.transfer",
        "purchases.view",
        "purchases.create",
        "purchases.confirm",
        "purchases.receive",
        "sales.view",
        "sales.create",
        "sales.validate",
        "inventory.view",
        "inventory.create",
        "inventory.count",
        "inventory.validate",
        "reports.view",
        "reports.export",
        "prices.view_cost",
    },
    "STAFF": {
        "products.view",
        "stock.view",
        "sales.view",
        "sales.create",
        "sales.validate",
        "inventory.view",
        "inventory.count",
    },
}

# Permissions qu'un propriétaire ou un administrateur peut accorder ou retirer
# individuellement à un gestionnaire ou un caissier, en plus de son rôle.
# Gestion des membres, paramètres, facturation et journal d'audit restent liés
# au rôle : les accorder permettrait de s'octroyer d'autres droits.
GRANTABLE_PERMISSIONS = frozenset(
    {
        "products.view",
        "products.create",
        "products.update",
        "products.deactivate",
        "prices.update",
        "prices.view_cost",
        "stock.view",
        "stock.transfer",
        "purchases.view",
        "purchases.create",
        "purchases.confirm",
        "purchases.receive",
        "sales.view",
        "sales.create",
        "sales.validate",
        "sales.cancel",
        "inventory.view",
        "inventory.create",
        "inventory.count",
        "inventory.validate",
        "reports.view",
        "reports.export",
    }
)

# Rôles dont les permissions peuvent être ajustées membre par membre.
CUSTOMIZABLE_ROLES = frozenset({"MANAGER", "STAFF"})

SAFE_WHEN_SUSPENDED = {
    "settings.view",
    "billing.manage",
}


class HasPermission(BasePermission):
    def __init__(self, permission):
        self.required = permission

    def has_permission(self, request, view):
        membership = getattr(request, "membership", None)
        if membership is None:
            return False
        org = request.organization
        if not org.has_operational_access():
            if org.status != "CANCELLED" and self.required in SAFE_WHEN_SUSPENDED:
                return membership.has_perm(self.required)
            return False
        return membership.has_perm(self.required)

    def __call__(self):
        return self


def require_permission(code):
    return type(
        f"Perm_{code.replace('.', '_')}",
        (BasePermission,),
        {
            "has_permission": lambda self, request, view, c=code: HasPermission(c).has_permission(
                request, view
            )
        },
    )
