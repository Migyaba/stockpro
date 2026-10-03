"use client";

import { useState } from "react";
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  PackageCheck,
  TrendingDown,
  Building2,
  Users,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatFCFA, formatDate, cn } from "@/lib/utils/format";
import { useAuthStore } from "@/lib/stores/authStore";
import { usePurchases, useConfirmPurchase } from "@/lib/hooks/usePurchases";
import { NewPurchaseSheet } from "@/components/purchases/NewPurchaseSheet";
import { PurchaseDetailSheet } from "@/components/purchases/PurchaseDetailSheet";
import type { Purchase, PurchaseStatus } from "@/lib/types/api";

const STATUS_MAP: Record<
  PurchaseStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  DRAFT: {
    label: "Brouillon",
    icon: Clock,
    color: "text-amber-400 bg-amber-950/40 border-amber-800/60",
  },
  CONFIRMED: {
    label: "Confirmée",
    icon: Truck,
    color: "text-sky-400 bg-sky-950/40 border-sky-800/60",
  },
  PARTIALLY_RECEIVED: {
    label: "Partielle",
    icon: PackageCheck,
    color: "text-indigo-400 bg-indigo-950/40 border-indigo-800/60",
  },
  RECEIVED: {
    label: "Reçue",
    icon: CheckCircle2,
    color: "text-emerald-400 bg-emerald-950/40 border-emerald-800/60",
  },
  CANCELLED: {
    label: "Annulée",
    icon: XCircle,
    color: "text-rose-400 bg-rose-950/40 border-rose-800/60",
  },
};

export default function AchatsPage() {
  const { warehouses, activeWarehouse } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | "">("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>(
    activeWarehouse?.id ?? ""
  );
  const [searchTerm, setSearchTerm] = useState("");

  const [newPurchaseOpen, setNewPurchaseOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading, refetch } = usePurchases({
    status: statusFilter,
    warehouse: warehouseFilter || undefined,
    search: searchTerm,
  });

  const confirmMutation = useConfirmPurchase();

  const purchases = data?.results ?? [];

  // Metrics
  const totalPurchasesAmount = purchases
    .filter((p) => p.status === "RECEIVED" || p.status === "PARTIALLY_RECEIVED")
    .reduce((acc, p) => acc + p.total, 0);

  const pendingCount = purchases.filter(
    (p) => p.status === "CONFIRMED" || p.status === "PARTIALLY_RECEIVED"
  ).length;
  const receivedCount = purchases.filter((p) => p.status === "RECEIVED").length;
  const draftCount = purchases.filter((p) => p.status === "DRAFT").length;

  function handleRowClick(purchase: Purchase) {
    setSelectedPurchase(purchase);
    setDetailOpen(true);
  }

  async function handleQuickConfirm(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await confirmMutation.mutateAsync(id);
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Page Title & Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Achats & Approvisionnements
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Gestion des commandes fournisseurs, réceptions physiques et rentrées en stock.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualiser
          </button>
          <button
            type="button"
            onClick={() => setNewPurchaseOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Nouvelle commande
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Volume Approvisionné</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
            {formatFCFA(totalPurchasesAmount)}
          </p>
          <span className="mt-1 block text-xs text-zinc-400">
            Commandes reçues ou partielles
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">En cours / Attente</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-sky-600 dark:text-sky-400 tabular-nums">
            {pendingCount}
          </p>
          <span className="mt-1 block text-xs text-zinc-400">
            Livraisons fournisseurs attendues
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Entièrement reçues</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {receivedCount}
          </p>
          <span className="mt-1 block text-xs text-zinc-400">
            Stocks physiquement réceptionnés
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Brouillons</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {draftCount}
          </p>
          <span className="mt-1 block text-xs text-zinc-400">
            En préparation avant envoi
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Rechercher par référence, fournisseur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Warehouse filter */}
          {warehouses.length > 1 && (
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Tous les dépôts</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-1">
            <button
              onClick={() => setStatusFilter("")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-lg transition",
                statusFilter === ""
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              Tous
            </button>
            {(["DRAFT", "CONFIRMED", "PARTIALLY_RECEIVED", "RECEIVED"] as PurchaseStatus[]).map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-lg transition",
                    statusFilter === st
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-semibold"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  )}
                >
                  {STATUS_MAP[st]?.label}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Purchases Data Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              <tr>
                <th scope="col" className="px-5 py-3.5">Référence</th>
                <th scope="col" className="px-5 py-3.5">Date</th>
                <th scope="col" className="px-5 py-3.5">Fournisseur</th>
                <th scope="col" className="px-5 py-3.5">Dépôt réception</th>
                <th scope="col" className="px-5 py-3.5">Réception</th>
                <th scope="col" className="px-5 py-3.5 text-right">Montant Total</th>
                <th scope="col" className="px-5 py-3.5">Statut</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-zinc-400">
                    Chargement des commandes d&apos;achat…
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-zinc-400">
                    Aucune commande d&apos;achat trouvée.
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => {
                  const cfg = STATUS_MAP[purchase.status] ?? STATUS_MAP.DRAFT;
                  const StatusIcon = cfg.icon;

                  // Overall reception calculation
                  const totalQty = purchase.items.reduce((acc, it) => acc + it.quantity, 0);
                  const totalRecv = purchase.items.reduce(
                    (acc, it) => acc + it.quantity_received,
                    0
                  );
                  const pct = totalQty > 0 ? Math.round((totalRecv / totalQty) * 100) : 0;

                  return (
                    <tr
                      key={purchase.id}
                      onClick={() => handleRowClick(purchase)}
                      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-5 py-4 font-mono font-semibold text-zinc-900 dark:text-white">
                        {purchase.reference}
                      </td>

                      <td className="px-5 py-4 text-xs">
                        <span className="font-medium text-zinc-900 dark:text-zinc-200">
                          {formatDate(purchase.purchase_date)}
                        </span>
                        {purchase.expected_date && (
                          <span className="block text-[11px] text-zinc-400">
                            Prévue : {formatDate(purchase.expected_date)}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs font-medium text-zinc-900 dark:text-zinc-200">
                        {purchase.supplier_name}
                      </td>

                      <td className="px-5 py-4 text-xs text-zinc-500">
                        {purchase.warehouse_name}
                      </td>

                      <td className="px-5 py-4 text-xs w-36">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-500">{totalRecv}/{totalQty}</span>
                            <span className={cn("font-medium", pct === 100 ? "text-emerald-400" : "text-zinc-400")}>
                              {pct}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-indigo-500" : "bg-transparent"
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right font-bold text-zinc-900 dark:text-white tabular-nums">
                        {formatFCFA(purchase.total)}
                      </td>

                      <td className="px-5 py-4">
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
                            cfg.color
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          <span>{cfg.label}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {purchase.status === "DRAFT" && (
                            <button
                              type="button"
                              onClick={(e) => handleQuickConfirm(e, purchase.id)}
                              className="rounded-lg border border-sky-800/60 bg-sky-950/40 px-2.5 py-1 text-xs font-semibold text-sky-400 hover:bg-sky-900/60 transition"
                            >
                              Confirmer
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(purchase);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sheets */}
      <NewPurchaseSheet
        open={newPurchaseOpen}
        onOpenChange={setNewPurchaseOpen}
      />

      <PurchaseDetailSheet
        purchase={selectedPurchase}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
