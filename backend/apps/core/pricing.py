"""Calcul des montants d'une ligne commerciale (entiers uniquement, cf. §33)."""


def _round_div(numerator: int, denominator: int) -> int:
    return (numerator + denominator // 2) // denominator


def compute_line_amounts(*, quantity: int, unit_price: int, discount: int, organization):
    """Retourne (tax, total) d'une ligne selon la TVA de l'organisation.

    - TVA désactivée : tax = 0, total = net.
    - Prix TTC : la taxe est extraite du net, le total reste le net.
    - Prix HT : la taxe s'ajoute au net.
    """
    net = quantity * unit_price - discount
    bps = organization.tax_rate_bps if organization.tax_enabled else 0
    if bps <= 0 or net <= 0:
        return 0, net
    if organization.prices_include_tax:
        base = _round_div(net * 10_000, 10_000 + bps)
        return net - base, net
    tax = _round_div(net * bps, 10_000)
    return tax, net + tax
