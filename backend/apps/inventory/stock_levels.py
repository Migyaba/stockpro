"""Niveaux de stock — règle unique (§36), partagée par l'API, les alertes et le dashboard.

- rupture (OUT_OF_STOCK) : quantité 0 ;
- stock faible (LOW) : 0 < quantité ≤ seuil minimum, pour un produit qui a un seuil ;
- normal (NORMAL) : tout le reste.
"""

from django.db.models import F, Q

OUT_OF_STOCK = "OUT_OF_STOCK"
LOW = "LOW"
NORMAL = "NORMAL"

# Filtres pour des querysets de StockPosition.
OUT_OF_STOCK_Q = Q(quantity=0)
LOW_Q = Q(quantity__gt=0, product__minimum_stock__gt=0, quantity__lte=F("product__minimum_stock"))


def stock_level(quantity: int, minimum_stock: int) -> str:
    if quantity == 0:
        return OUT_OF_STOCK
    if minimum_stock and quantity <= minimum_stock:
        return LOW
    return NORMAL
