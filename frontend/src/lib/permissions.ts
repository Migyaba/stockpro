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
