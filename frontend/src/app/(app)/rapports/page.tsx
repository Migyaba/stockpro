"use client";

import { useMemo, useState } from "react";
import { BarChart3, Download, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BreakdownBars } from "@/components/reports/BreakdownBars";
import { RevenueChart, type RevenuePoint } from "@/components/reports/RevenueChart";
import { StatTile } from "@/components/reports/StatTile";
import { downloadExport } from "@/lib/api/reports";
import { usePurchasesReport, useSalesReport } from "@/lib/hooks/useReports";
import { useAuthStore } from "@/lib/stores/authStore";
import { toast } from "@/lib/stores/toastStore";
import { cn, formatFCFA, formatFCFAShort } from "@/lib/utils/format";
import type { ExportKind, ReportPeriodParams, SalesReport, SalesReportProduct } from "@/lib/types/api";

type Preset = "7d" | "30d" | "month" | "year";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "month", label: "Ce mois" },
  { value: "year", label: "Cette année" },
];

const EXPORTS: { kind: ExportKind; label: string }[] = [
  { kind: "sales", label: "Ventes (une ligne par vente)" },
  { kind: "products", label: "Ventes par produit" },
  { kind: "purchases", label: "Achats" },
  { kind: "movements", label: "Mouvements de stock" },
  { kind: "stock", label: "État du stock (actuel)" },
];

function isoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function presetRange(preset: Preset): { date_from: string; date_to: string } {
  const today = new Date();
  const from = new Date(today);
  if (preset === "7d") from.setDate(today.getDate() - 6);
  else if (preset === "30d") from.setDate(today.getDate() - 29);
  else if (preset === "month") from.setDate(1);
  else from.setMonth(0, 1);
  return { date_from: isoDate(from), date_to: isoDate(today) };
}

const DAY_LABEL = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const MONTH_LABEL = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" });

// Au-delà de ~2 mois, des colonnes journalières deviennent illisibles : on agrège par mois.
function toChartPoints(series: SalesReport["series"]): RevenuePoint[] {
  const byDay = series.length <= 62;
  const points = new Map<string, RevenuePoint>();
  for (const s of series) {
    const date = new Date(`${s.date}T00:00:00`);
    const key = byDay ? s.date : s.date.slice(0, 7);
    const point = points.get(key) ?? {
      key,
      label: byDay ? DAY_LABEL.format(date) : MONTH_LABEL.format(date),
      revenue: 0,
      count: 0,
      margin: s.margin === undefined ? undefined : 0,
    };
    point.revenue += s.revenue;
    point.count += s.count;
    if (s.margin !== undefined) point.margin = (point.margin ?? 0) + s.margin;
    points.set(key, point);
  }
  return [...points.values()];
}

export default function RapportsPage() {
  const { warehouses, permissions, canViewCost } = useAuthStore();
  const canExport = permissions.includes("reports.export");
  const [preset, setPreset] = useState<Preset>("30d");
  const [warehouse, setWarehouse] = useState("");
  const [productView, setProductView] = useState<"top" | "least">("top");
  const [exporting, setExporting] = useState<ExportKind | null>(null);

  const params: ReportPeriodParams = useMemo(
    () => ({ ...presetRange(preset), warehouse: warehouse || undefined }),
    [preset, warehouse]
  );
  const sales = useSalesReport(params);
  const purchases = usePurchasesReport(params);
  const report = sales.data;
  const totals = report?.totals;
  const chartPoints = useMemo(() => (report ? toChartPoints(report.series) : []), [report]);
  const products: SalesReportProduct[] =
    (productView === "top" ? report?.top_products : report?.least_products) ?? [];

  async function handleExport(kind: ExportKind) {
    setExporting(kind);
    try {
      await downloadExport(kind, params);
    } catch (err) {
      toast.apiError(err, "Export impossible.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Rapports</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Ventes validées uniquement · marge calculée sur le coût au jour de la vente, hors TVA
          </p>
        </div>
        {canExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Exporter (CSV)
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Période et dépôt sélectionnés</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {EXPORTS.map((e) => (
                <DropdownMenuItem key={e.kind} disabled={!!exporting} onClick={() => handleExport(e.kind)}>
                  {e.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Filtres : une ligne, au-dessus de tout ce qu'ils filtrent. */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPreset(p.value)}
              aria-pressed={preset === p.value}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                preset === p.value
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {warehouses.length > 1 && (
          <select
            value={warehouse}
            onChange={(e) => setWarehouse(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <option value="">Tous les dépôts</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        )}
        {sales.isFetching && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
      </div>

      {sales.isError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          Impossible de charger le rapport. Réessayez dans un instant.
        </p>
      ) : !report || !totals ? (
        <div className="flex justify-center p-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : (
        // Pendant un rechargement, l'ancien rendu reste en place, atténué.
        <div className={cn("flex flex-col gap-6 transition-opacity", sales.isPlaceholderData && "opacity-60")}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatTile label="Chiffre d'affaires" value={formatFCFA(totals.revenue)} delta={totals.revenue_evolution_pct} />
            <StatTile label="Ventes validées" value={totals.count.toLocaleString("fr-FR")} hint="sur la période" />
            <StatTile label="Panier moyen" value={formatFCFA(totals.average_ticket)} hint="par vente" />
            {canViewCost && totals.margin !== undefined && (
              <StatTile
                label="Marge brute"
                value={formatFCFA(totals.margin)}
                hint={totals.margin_pct != null ? `${totals.margin_pct.toLocaleString("fr-FR")} % du CA HT` : "—"}
              />
            )}
            <StatTile
              label="Achats commandés"
              value={formatFCFA(purchases.data?.totals.ordered ?? 0)}
              delta={purchases.data?.totals.ordered_evolution_pct}
              upIsGood={false}
            />
          </div>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Chiffre d&apos;affaires par {report.series.length <= 62 ? "jour" : "mois"}
            </h2>
            <p className="mb-4 text-xs text-zinc-500">
              TTC{totals.tax > 0 && ` · dont TVA ${formatFCFAShort(totals.tax)}`}
              {totals.discount > 0 && ` · remises ${formatFCFAShort(totals.discount)}`}
            </p>
            {totals.count === 0 ? (
              <p className="py-12 text-center text-sm text-zinc-500">Aucune vente validée sur la période.</p>
            ) : (
              <RevenueChart points={chartPoints} showMargin={canViewCost} />
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
              <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Par dépôt</h2>
              <BreakdownBars
                emptyLabel="Aucune vente."
                rows={report.by_warehouse.map((w) => ({
                  key: w.id,
                  label: w.name,
                  value: w.revenue,
                  detail: `${w.count} vente${w.count > 1 ? "s" : ""}`,
                }))}
              />
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
              <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Par catégorie</h2>
              <BreakdownBars
                emptyLabel="Aucune vente."
                rows={report.by_category.map((c) => ({
                  key: c.name,
                  label: c.name,
                  value: c.revenue,
                  detail: `${c.quantity.toLocaleString("fr-FR")} unité${c.quantity > 1 ? "s" : ""}`,
                }))}
              />
            </section>
          </div>

          <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex flex-wrap items-center justify-between gap-2 p-5 pb-3">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Produits</h2>
              <div className="flex gap-1">
                {(["top", "least"] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setProductView(view)}
                    aria-pressed={productView === view}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium",
                      productView === view
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    )}
                  >
                    {view === "top" ? "Plus vendus" : "Moins vendus"}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-y border-zinc-200 bg-zinc-50/75 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40">
                  <tr>
                    <th className="px-5 py-2.5">Produit</th>
                    <th className="hidden px-5 py-2.5 md:table-cell">Catégorie</th>
                    <th className="px-5 py-2.5 text-right">Qté</th>
                    <th className="px-5 py-2.5 text-right">CA</th>
                    {canViewCost && <th className="hidden px-5 py-2.5 text-right sm:table-cell">Marge</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-sm text-zinc-500">
                        {productView === "least" && report.products.length > 0
                          ? "Moins de 10 produits vendus : voir « Plus vendus »."
                          : "Aucune vente sur la période."}
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      const marginPct =
                        p.margin !== undefined && p.revenue > 0 ? Math.round((p.margin / p.revenue) * 100) : null;
                      return (
                        <tr key={p.id}>
                          <td className="px-5 py-3">
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">{p.name}</p>
                            <p className="font-mono text-[11px] text-zinc-400">{p.sku}</p>
                          </td>
                          <td className="hidden px-5 py-3 text-zinc-500 md:table-cell">{p.category}</td>
                          <td className="px-5 py-3 text-right tabular-nums">{p.quantity.toLocaleString("fr-FR")}</td>
                          <td className="px-5 py-3 text-right tabular-nums">{formatFCFA(p.revenue)}</td>
                          {canViewCost && (
                            <td className="hidden px-5 py-3 text-right tabular-nums sm:table-cell">
                              {formatFCFA(p.margin ?? 0)}
                              {marginPct !== null && <span className="ml-1 text-xs text-zinc-400">{marginPct} %</span>}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {purchases.data && (
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Achats</h2>
              <p className="mb-4 text-xs text-zinc-500">
                {purchases.data.totals.count} commande{purchases.data.totals.count > 1 ? "s" : ""} ·{" "}
                {formatFCFA(purchases.data.totals.received_value)} de marchandise réceptionnée sur la période
              </p>
              <BreakdownBars
                emptyLabel="Aucune commande confirmée sur la période."
                rows={purchases.data.top_suppliers.map((s) => ({
                  key: s.id,
                  label: s.name,
                  value: s.total,
                  detail: `${s.count} commande${s.count > 1 ? "s" : ""}`,
                }))}
              />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
