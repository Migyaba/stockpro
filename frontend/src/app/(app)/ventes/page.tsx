"use client";

import { useState } from "react";
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  FileSpreadsheet,
  TrendingUp,
  Receipt,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatFCFA, formatDate, cn } from "@/lib/utils/format";
import { useAuthStore } from "@/lib/stores/authStore";
import { useSales, useCompleteSale, useCancelSale } from "@/lib/hooks/useSales";
import { NewSaleSheet } from "@/components/sales/NewSaleSheet";
import { SaleDetailSheet } from "@/components/sales/SaleDetailSheet";
import type { Sale, SaleStatus } from "@/lib/types/api";

export default function VentesPage() {
  const { canCancelSale } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<SaleStatus | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [newSaleOpen, setNewSaleOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const { data, isLoading } = useSales({
    status: statusFilter,
    search: searchTerm,
  });

  const completeMutation = useCompleteSale();
  const cancelMutation = useCancelSale();

  const sales = data?.results ?? [];

  // Metrics computation
  const totalSalesAmount = sales
    .filter((s) => s.status === "COMPLETED")
    .reduce((acc, s) => acc + s.total, 0);

  const completedCount = sales.filter((s) => s.status === "COMPLETED").length;
  const draftCount = sales.filter((s) => s.status === "DRAFT").length;
  const averageTicket =
    completedCount > 0 ? Math.round(totalSalesAmount / completedCount) : 0;

  async function handleQuickComplete(saleId: string) {
    await completeMutation.mutateAsync(saleId);
  }

  async function handleQuickCancel(saleId: string) {
    if (confirm("Êtes-vous sûr de vouloir annuler cette vente ? Le stock sera réintégré.")) {
      await cancelMutation.mutateAsync(saleId);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Page Title & Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Ventes & Facturation
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Gestion des bordereaux de vente, déstockage et suivi des encaissements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setNewSaleOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Nouvelle vente
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* CA Validé */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Chiffre d&apos;affaires</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight">
            {formatFCFA(totalSalesAmount)}
          </p>
          <span className="mt-1 block text-xs text-zinc-400">
            Sur les ventes validées
          </span>
        </div>

        {/* Ventes Finalisées */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Ventes validées</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight">
            {completedCount}
          </p>
          <span className="mt-1 block text-xs text-emerald-600 dark:text-emerald-400">
            Déstockage effectué
          </span>
        </div>

        {/* Brouillons en attente */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Brouillons en attente</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight">
            {draftCount}
          </p>
          <span className="mt-1 block text-xs text-amber-600 dark:text-amber-400">
            À encaisser ou valider
          </span>
        </div>

        {/* Panier Moyen */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Panier moyen</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight">
            {formatFCFA(averageTicket)}
          </p>
          <span className="mt-1 block text-xs text-zinc-400">
            Moyenne par commande
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter("")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === ""
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            Toutes ({sales.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("COMPLETED")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === "COMPLETED"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            Validées
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("DRAFT")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === "DRAFT"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            Brouillons
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("CANCELLED")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === "CANCELLED"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            Annulées
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Rechercher référence, client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 py-1.5 pl-9 pr-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 font-semibold text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Référence</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Client</th>
                <th className="px-6 py-3.5">Dépôt</th>
                <th className="px-6 py-3.5 text-center">Articles</th>
                <th className="px-6 py-3.5 text-right">Montant Total</th>
                <th className="px-6 py-3.5 text-center">Statut</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="px-6 py-4">
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : sales.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-16 text-center text-zinc-400 dark:text-zinc-600"
                  >
                    <ShoppingBag className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm font-medium">Aucune vente trouvée</p>
                    <p className="text-xs mt-1">Créez votre première vente pour démarrer</p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* Reference */}
                    <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-white">
                      <button
                        type="button"
                        onClick={() => setSelectedSale(sale)}
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
                      >
                        {sale.reference}
                      </button>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">
                      {formatDate(sale.sale_date)}
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-200">
                      {sale.customer_name || (
                        <span className="italic text-zinc-400">Client Comptoir</span>
                      )}
                    </td>

                    {/* Warehouse */}
                    <td className="px-6 py-4 text-zinc-500">
                      {sale.warehouse_name || "Dépôt Principal"}
                    </td>

                    {/* Item count */}
                    <td className="px-6 py-4 text-center tabular-nums text-zinc-600 dark:text-zinc-400">
                      {sale.items?.length || 0}
                    </td>

                    {/* Total Amount */}
                    <td className="px-6 py-4 text-right tabular-nums font-bold text-zinc-900 dark:text-white">
                      {formatFCFA(sale.total)}
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4 text-center">
                      {sale.status === "COMPLETED" && (
                        <Badge
                          variant="success"
                          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Validée
                        </Badge>
                      )}
                      {sale.status === "DRAFT" && (
                        <Badge
                          variant="warning"
                          className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        >
                          <Clock className="mr-1 h-3 w-3" />
                          Brouillon
                        </Badge>
                      )}
                      {sale.status === "CANCELLED" && (
                        <Badge
                          variant="destructive"
                          className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        >
                          <XCircle className="mr-1 h-3 w-3" />
                          Annulée
                        </Badge>
                      )}
                    </td>

                    {/* Quick actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedSale(sale)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {sale.status === "DRAFT" && (
                          <button
                            type="button"
                            onClick={() => handleQuickComplete(sale.id)}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs hover:bg-emerald-500 transition-colors"
                          >
                            Valider
                          </button>
                        )}

                        {sale.status === "COMPLETED" && canCancelSale && (
                          <button
                            type="button"
                            onClick={() => handleQuickCancel(sale.id)}
                            className="rounded-lg border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 text-[11px] font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sale Slide-Over */}
      <NewSaleSheet open={newSaleOpen} onOpenChange={setNewSaleOpen} />

      {/* Sale Detail Slide-Over */}
      <SaleDetailSheet
        sale={selectedSale}
        open={!!selectedSale}
        onOpenChange={(open) => !open && setSelectedSale(null)}
      />
    </div>
  );
}
