"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Loader2, PackageX } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { useStockAlerts } from "@/lib/hooks/useNotifications";
import { useAuthStore } from "@/lib/stores/authStore";
import { cn, formatQuantity } from "@/lib/utils/format";

const PAGE_SIZE = 50;
type Kind = "" | "out" | "low";

export default function StockAlertsPage() {
  const { warehouses, permissions } = useAuthStore();
  const canOrder = permissions.includes("purchases.create");
  const [kind, setKind] = useState<Kind>("");
  const [warehouse, setWarehouse] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useStockAlerts({ kind, warehouse, page, page_size: PAGE_SIZE });
  const summary = data?.summary ?? { out: 0, low: 0 };

  const FILTERS: { value: Kind; label: string }[] = [
    { value: "", label: `Toutes (${summary.out + summary.low})` },
    { value: "out", label: `Ruptures (${summary.out})` },
    { value: "low", label: `Stock faible (${summary.low})` },
  ];

  return (
    <div className="flex w-full flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div>
        <Link
          href="/stock"
          className="mb-2 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Stock
        </Link>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Alertes de stock</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Produits épuisés ou sous leur seuil minimum, par dépôt. Le seuil se règle sur la fiche produit.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            type="button"
            aria-pressed={kind === f.value}
            onClick={() => {
              setKind(f.value);
              setPage(1);
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium",
              kind === f.value
                ? "bg-indigo-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            )}
          >
            {f.label}
          </button>
        ))}
        {warehouses.length > 1 && (
          <select
            value={warehouse}
            onChange={(e) => {
              setWarehouse(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs dark:border-zinc-800 dark:bg-zinc-900"
          >
            <option value="">Tous les dépôts</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        )}
        {canOrder && (
          <Link
            href="/achats"
            className="ml-auto rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            Commander auprès d&apos;un fournisseur
          </Link>
        )}
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-opacity dark:border-zinc-800 dark:bg-zinc-900/60",
          isFetching && !isLoading && "opacity-70"
        )}
      >
        {isLoading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : (data?.results ?? []).length === 0 ? (
          <p className="p-10 text-center text-sm text-zinc-500">Aucune alerte : tous les stocks sont au-dessus des seuils.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {data!.results.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  {/* Icône + libellé : l'état ne repose jamais sur la seule couleur. */}
                  {a.kind === "out" ? (
                    <PackageX className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{a.product_name}</p>
                    <p className="text-[11px] text-zinc-400">
                      <span className="font-mono">{a.product_sku}</span> · {a.warehouse_name}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {a.kind === "out" ? "Rupture" : "Stock faible"}
                  </p>
                  <p className="text-[11px] tabular-nums text-zinc-500">
                    {formatQuantity(a.quantity)} {a.unit} · seuil {formatQuantity(a.minimum_stock)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.count ?? 0} onPageChange={setPage} />
      </div>
    </div>
  );
}
