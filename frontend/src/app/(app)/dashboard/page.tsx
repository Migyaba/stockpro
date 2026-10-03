"use client";

import { useState } from "react";
import {
  Boxes,
  ShoppingCart,
  AlertTriangle,
  Truck,
  RefreshCw,
  Plus,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StockTable } from "@/components/dashboard/StockTable";
import { ProductSheet } from "@/components/dashboard/ProductSheet";
import { NewProductSheet } from "@/components/dashboard/NewProductSheet";
import { useDashboardKpis, useStockPositions } from "@/lib/hooks/useDashboard";
import { formatFCFAShort, formatQuantity } from "@/lib/utils/format";
import type { StockPosition } from "@/lib/types/api";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/useDashboard";

const PAGE_SIZE = 25;

export default function DashboardPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<StockPosition | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newProductOpen, setNewProductOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: kpis, isLoading: kpisLoading } = useDashboardKpis();
  const { data: stockData, isLoading: stockLoading } = useStockPositions({
    page,
    page_size: PAGE_SIZE,
    search,
  });

  function handleRowClick(position: StockPosition) {
    setSelectedPosition(position);
    setSheetOpen(true);
  }

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: queryKeys.kpis });
    queryClient.invalidateQueries({ queryKey: ["stock"] });
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Tableau de bord
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Vue d&apos;ensemble des stocks et de l&apos;activité du jour
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualiser
          </button>
          <button
            onClick={() => setNewProductOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Nouveau produit
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Valeur totale du stock"
          value={
            kpis ? formatFCFAShort(kpis.stock_value) : "—"
          }
          changePct={kpis?.stock_value_change_pct ?? null}
          icon={Boxes}
          iconColor="text-indigo-600 dark:text-indigo-400"
          iconBg="bg-indigo-50 dark:bg-indigo-950"
          loading={kpisLoading}
        />
        <KpiCard
          label="Ventes du jour"
          value={kpis ? formatFCFAShort(kpis.sales_today) : "—"}
          subValue={
            kpis
              ? `${formatQuantity(kpis.sales_today_count)} commande${kpis.sales_today_count > 1 ? "s" : ""}`
              : undefined
          }
          changePct={kpis?.sales_today_change_pct ?? null}
          icon={ShoppingCart}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-950"
          loading={kpisLoading}
        />
        <KpiCard
          label="Ruptures imminentes"
          value={kpis ? String(kpis.low_stock_count) : "—"}
          subValue={
            kpis && kpis.low_stock_count > 0
              ? "produits en alerte"
              : "Tout est en ordre"
          }
          icon={AlertTriangle}
          iconColor={
            (kpis?.low_stock_count ?? 0) > 0
              ? "text-rose-600 dark:text-rose-400"
              : "text-zinc-400"
          }
          iconBg={
            (kpis?.low_stock_count ?? 0) > 0
              ? "bg-rose-50 dark:bg-rose-950"
              : "bg-zinc-100 dark:bg-zinc-800"
          }
          loading={kpisLoading}
          alert={(kpis?.low_stock_count ?? 0) > 0}
        />
        <KpiCard
          label="Commandes en attente"
          value={kpis ? String(kpis.pending_purchases) : "—"}
          subValue={
            kpis && kpis.pending_purchases > 0
              ? "à confirmer / réceptionner"
              : "Aucune commande en attente"
          }
          icon={Truck}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 dark:bg-amber-950"
          loading={kpisLoading}
        />
      </div>

      {/* Stock table */}
      <StockTable
        data={stockData?.results ?? []}
        total={stockData?.count ?? 0}
        page={page}
        pageSize={PAGE_SIZE}
        loading={stockLoading}
        onPageChange={setPage}
        onSearch={(q) => {
          setSearch(q);
          setPage(1);
        }}
        onRowClick={handleRowClick}
      />

      {/* Product slide-over */}
      <ProductSheet
        position={selectedPosition}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      {/* New Product sheet */}
      <NewProductSheet
        open={newProductOpen}
        onOpenChange={setNewProductOpen}
      />
    </div>
  );
}
