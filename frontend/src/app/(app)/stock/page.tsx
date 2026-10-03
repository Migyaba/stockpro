"use client";

import { useState } from "react";
import { Boxes, RefreshCw, Layers, AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import { StockTable } from "@/components/dashboard/StockTable";
import { ProductSheet } from "@/components/dashboard/ProductSheet";
import { NewProductSheet } from "@/components/dashboard/NewProductSheet";
import { useStockPositions } from "@/lib/hooks/useDashboard";
import { useAuthStore } from "@/lib/stores/authStore";
import { useQueryClient } from "@tanstack/react-query";
import type { StockPosition } from "@/lib/types/api";

const PAGE_SIZE = 25;

export default function StockPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<StockPosition | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newProductOpen, setNewProductOpen] = useState(false);
  const { warehouses, activeWarehouse } = useAuthStore();
  const [warehouseFilter, setWarehouseFilter] = useState<string>(
    activeWarehouse?.id ?? ""
  );

  const queryClient = useQueryClient();

  const { data: stockData, isLoading: stockLoading } = useStockPositions({
    page,
    page_size: PAGE_SIZE,
    search,
    warehouse: warehouseFilter || undefined,
  });

  function handleRowClick(position: StockPosition) {
    setSelectedPosition(position);
    setSheetOpen(true);
  }

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: ["stock"] });
  }

  const positions = stockData?.results ?? [];
  const ruptureCount = positions.filter((p) => p.quantity === 0).length;
  const lowStockCount = positions.filter(
    (p) => p.quantity > 0 && p.quantity <= p.product.minimum_stock
  ).length;
  const normalStockCount = positions.filter(
    (p) => p.quantity > p.product.minimum_stock
  ).length;

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Gestion des Stocks
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Niveaux de stocks en temps réel, alertes seuils et historique des mouvements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {warehouses.length > 1 && (
            <select
              value={warehouseFilter}
              onChange={(e) => {
                setWarehouseFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Tous les dépôts</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualiser
          </button>

          <button
            onClick={() => setNewProductOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/30 transition active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            Nouveau produit
          </button>
        </div>
      </div>

      {/* Stock Health Badges Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-500">Stock optimal</span>
            <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">
              {normalStockCount} références
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-500">Stock bas / seuil</span>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {lowStockCount} références
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-500">Ruptures totales</span>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              {ruptureCount} références
            </p>
          </div>
        </div>
      </div>

      {/* Stock Table Component */}
      <StockTable
        data={stockData?.results ?? []}
        total={stockData?.count ?? 0}
        page={page}
        pageSize={PAGE_SIZE}
        loading={stockLoading}
        onPageChange={setPage}
        onSearch={(q: string) => {
          setSearch(q);
          setPage(1);
        }}
        onRowClick={handleRowClick}
      />

      {/* Product Movement Slide-over */}
      <ProductSheet
        position={selectedPosition}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      {/* New Product Creation Sheet */}
      <NewProductSheet
        open={newProductOpen}
        onOpenChange={setNewProductOpen}
      />
    </div>
  );
}
