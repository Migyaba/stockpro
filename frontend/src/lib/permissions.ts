// Permission requise pour afficher chaque page de l'application (cf. matrice §16.1).
// Les codes viennent du backend (/auth/membership/ → permissions) ; le backend
// reste la seule vraie barrière, ceci évite seulement d'afficher des pages en 403.
export const ROUTE_PERMISSIONS: Record<string, string | null> = {
  "/dashboard": "products.view",
  "/produits": "products.view",
  "/ventes": "sales.view",
  "/stock": "stock.view",
  "/achats": "purchases.view",
  "/contacts": "sales.view",
  "/inventaires": "inventory.view",
  "/rapports": "reports.view",
  // Accessible à tous : l'onglet « Sécurité » (mot de passe) concerne chaque membre.
  "/parametres": null,
};

export function requiredPermission(pathname: string): string | null {
  const route = Object.keys(ROUTE_PERMISSIONS).find(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
  return route ? ROUTE_PERMISSIONS[route] : null;
}

// Libellés des permissions ajustables membre par membre (GRANTABLE_PERMISSIONS
// côté backend, apps/core/permissions.py), groupés par module.
export const PERMISSION_GROUPS: { label: string; permissions: { code: string; label: string }[] }[] = [
  {
    label: "Produits",
    permissions: [
      { code: "products.view", label: "Voir les produits" },
      { code: "products.create", label: "Créer des produits" },
      { code: "products.update", label: "Modifier les produits" },
      { code: "products.deactivate", label: "Désactiver des produits" },
      { code: "prices.update", label: "Modifier les prix" },
      { code: "prices.view_cost", label: "Voir les prix d'achat et les marges" },
    ],
  },
  {
    label: "Stock",
    permissions: [
      { code: "stock.view", label: "Voir le stock" },
      { code: "stock.transfer", label: "Transférer entre dépôts" },
    ],
  },
  {
    label: "Achats",
    permissions: [
      { code: "purchases.view", label: "Voir les achats" },
      { code: "purchases.create", label: "Créer des commandes" },
      { code: "purchases.confirm", label: "Confirmer les commandes" },
      { code: "purchases.receive", label: "Réceptionner" },
    ],
  },
  {
    label: "Ventes",
    permissions: [
      { code: "sales.view", label: "Voir les ventes" },
      { code: "sales.create", label: "Créer des ventes" },
      { code: "sales.validate", label: "Valider les ventes" },
      { code: "sales.cancel", label: "Annuler des ventes" },
    ],
  },
  {
    label: "Inventaires",
    permissions: [
      { code: "inventory.view", label: "Voir les inventaires" },
      { code: "inventory.create", label: "Ouvrir un inventaire" },
      { code: "inventory.count", label: "Compter" },
      { code: "inventory.validate", label: "Valider un inventaire" },
    ],
  },
  {
    label: "Rapports",
    permissions: [
      { code: "reports.view", label: "Voir les rapports" },
      { code: "reports.export", label: "Exporter (CSV)" },
    ],
  },
];
