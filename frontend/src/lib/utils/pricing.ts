import type { Organization } from "@/lib/types/api";

type TaxSettings = Pick<Organization, "tax_enabled" | "tax_rate_bps" | "prices_include_tax">;

function roundDiv(numerator: number, denominator: number): number {
  return Math.floor((numerator + Math.floor(denominator / 2)) / denominator);
}

/**
 * Aperçu du calcul serveur (backend/apps/core/pricing.py) : mêmes arrondis
 * entiers, pour que le total affiché corresponde au total enregistré.
 */
export function computeLineAmounts(
  quantity: number,
  unitPrice: number,
  discount: number,
  org: Partial<TaxSettings> | null | undefined
): { tax: number; total: number } {
  const net = quantity * unitPrice - discount;
  const bps = org?.tax_enabled ? org.tax_rate_bps ?? 0 : 0;
  if (bps <= 0 || net <= 0) return { tax: 0, total: net };
  if (org?.prices_include_tax ?? true) {
    const base = roundDiv(net * 10_000, 10_000 + bps);
    return { tax: net - base, total: net };
  }
  const tax = roundDiv(net * bps, 10_000);
  return { tax, total: net + tax };
}
