"use client";

import { useState } from "react";
import { cn, formatFCFA } from "@/lib/utils/format";

export interface RevenuePoint {
  /** Clé ISO (AAAA-MM-JJ ou AAAA-MM). */
  key: string;
  label: string;
  revenue: number;
  count: number;
  margin?: number;
}

const CHART_HEIGHT = 200;

// Graduation « ronde » de l'axe : 0 / 25k / 50k… plutôt qu'un maximum brut.
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value / 4) ?? 10;
  return Math.ceil(value / (step * magnitude)) * step * magnitude;
}

function compact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  if (value >= 1_000) return `${(value / 1_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} k`;
  return value.toLocaleString("fr-FR");
}

/**
 * Colonnes d'une seule série (CA) : pas de légende, le titre de la carte nomme la série.
 * Teinte validée : indigo-600 sur fond clair, indigo-500 sur fond sombre.
 */
export function RevenueChart({ points, showMargin }: { points: RevenuePoint[]; showMargin: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...points.map((p) => p.revenue), 0));
  const ticks = [max, max / 2, 0];
  // Quelques repères sur l'axe X seulement : au-delà, la date est dans l'info-bulle.
  const labelEvery = Math.max(1, Math.ceil(points.length / 7));
  const activePoint = active !== null ? points[active] : null;

  return (
    <div className="relative">
      <div className="flex gap-2">
        {/* Axe Y */}
        <div
          className="flex shrink-0 flex-col justify-between text-right text-[10px] tabular-nums text-zinc-400"
          style={{ height: CHART_HEIGHT }}
          aria-hidden
        >
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {compact(t)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* Grille : hairlines recessives */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: CHART_HEIGHT }} aria-hidden>
            {ticks.map((t) => (
              <div key={t} className="h-px bg-zinc-200 dark:bg-zinc-800" />
            ))}
          </div>

          <div
            className="relative flex items-end gap-[2px]"
            style={{ height: CHART_HEIGHT }}
            onMouseLeave={() => setActive(null)}
          >
            {points.map((p, i) => {
              const height = p.revenue > 0 ? Math.max(2, (p.revenue / max) * CHART_HEIGHT) : 0;
              return (
                // La zone de survol couvre toute la hauteur de la colonne, pas seulement la barre.
                <button
                  key={p.key}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  aria-label={`${p.label} : ${formatFCFA(p.revenue)}, ${p.count} vente${p.count > 1 ? "s" : ""}`}
                  className="flex h-full min-w-0 flex-1 items-end justify-center focus:outline-none"
                >
                  <span
                    className={cn(
                      "block w-full max-w-[24px] rounded-t-[4px] bg-indigo-600 transition-opacity dark:bg-indigo-500",
                      active !== null && active !== i && "opacity-40"
                    )}
                    style={{ height }}
                  />
                </button>
              );
            })}
          </div>

          {/* Axe X */}
          <div className="mt-1.5 flex gap-[2px] text-[10px] text-zinc-400" aria-hidden>
            {points.map((p, i) => (
              <span key={p.key} className="min-w-0 flex-1 truncate text-center">
                {i % labelEvery === 0 ? p.label : ""}
              </span>
            ))}
          </div>

          {activePoint && (
            <div
              className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
              style={{ left: `${((active! + 0.5) / points.length) * 100}%` }}
            >
              <p className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatFCFA(activePoint.revenue)}
              </p>
              <p className="text-zinc-500">{activePoint.label}</p>
              <p className="text-zinc-500">
                {activePoint.count} vente{activePoint.count > 1 ? "s" : ""}
                {showMargin && activePoint.margin !== undefined && ` · marge ${formatFCFA(activePoint.margin)}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Vue tableau pour les lecteurs d'écran : aucune valeur n'est réservée au survol. */}
      <table className="sr-only">
        <caption>Chiffre d&apos;affaires par période</caption>
        <thead>
          <tr>
            <th>Période</th>
            <th>CA</th>
            <th>Ventes</th>
            {showMargin && <th>Marge</th>}
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.key}>
              <td>{p.label}</td>
              <td>{formatFCFA(p.revenue)}</td>
              <td>{p.count}</td>
              {showMargin && <td>{formatFCFA(p.margin ?? 0)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
