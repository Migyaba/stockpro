"use client";

import { useState, useMemo } from "react";
import type { SortingState } from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn, formatFCFA, formatQuantity } from "@/lib/utils/format";
import { getStockLevel, type StockPosition } from "@/lib/types/api";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/stores/authStore";

interface StockTableProps {
  data: StockPosition[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onRowClick: (position: StockPosition) => void;
}

const STOCK_BADGE: Record<
  ReturnType<typeof getStockLevel>,
  { label: string; variant: "success" | "warning" | "destructive" | "secondary" }
> = {
  normal: { label: "Normal", variant: "success" },
  low: { label: "Faible", variant: "warning" },
  critical: { label: "Critique", variant: "destructive" },
  out_of_stock: { label: "Rupture", variant: "secondary" },
};

export function StockTable({
  data,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
  onSearch,
  onRowClick,
}: StockTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const { canViewCost } = useAuthStore();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function handleSearch(value: string) {
    setGlobalFilter(value);
    onSearch(value);
  }

  // We use a manually-rendered approach to avoid TanStack Table v9 API complexity
  // while keeping the table structure clean and type-safe
  const sortedData = useMemo(() => {
    if (sorting.length === 0) return data;
    const { id, desc } = sorting[0];
    return [...data].sort((a, b) => {
      let aVal: unknown;
      let bVal: unknown;
      if (id === "quantity") { aVal = a.quantity; bVal = b.quantity; }
      else if (id === "selling_price") { aVal = a.product.selling_price; bVal = b.product.selling_price; }
      else if (id === "purchase_price") { aVal = a.product.purchase_price; bVal = b.product.purchase_price; }
      else if (id === "name") { aVal = a.product.name; bVal = b.product.name; }
      else { return 0; }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return desc ? bVal - aVal : aVal - bVal;
      }
      const aStr = String(aVal ?? "");
      const bStr = String(bVal ?? "");
      return desc ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
    });
  }, [data, sorting]);

  function toggleSort(id: string) {
    setSorting((prev) => {
      if (prev.length === 0 || prev[0].id !== id) return [{ id, desc: false }];
      if (!prev[0].desc) return [{ id, desc: true }];
      return [];
    });
  }

  function getSortIcon(id: string) {
    const current = sorting[0];
    if (!current || current.id !== id) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return current.desc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />;
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Rechercher un produit…"
            value={globalFilter}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-8 w-full rounded-md border border-zinc-200 bg-zinc-50 pl-8 pr-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {total.toLocaleString("fr-FR")} produit{total > 1 ? "s" : ""}
          </span>
          <button className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtres
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <Th width={220}>
                <SortBtn id="name" label="Produit" sortIcon={getSortIcon("name")} onSort={toggleSort} />
              </Th>
              <Th width={140}>Dépôt</Th>
              <Th width={120} right>
                <SortBtn id="quantity" label="Qté" sortIcon={getSortIcon("quantity")} onSort={toggleSort} right />
              </Th>
              <Th width={100}>Niveau</Th>
              <Th width={140} right>
                <SortBtn id="selling_price" label="Prix vente" sortIcon={getSortIcon("selling_price")} onSort={toggleSort} right />
              </Th>
              {canViewCost && (
                <Th width={140} right>
                  <SortBtn id="purchase_price" label="Prix achat" sortIcon={getSortIcon("purchase_price")} onSort={toggleSort} right />
                </Th>
              )}
              {canViewCost && <Th width={150} right>Valeur stock</Th>}
              <Th width={48} />
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800/50">
                    {[...Array(canViewCost ? 8 : 6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                      </td>
                    ))}
                  </tr>
                ))
              : sortedData.length === 0
              ? (
                  <tr>
                    <td colSpan={canViewCost ? 8 : 6} className="py-16 text-center text-sm text-zinc-400 dark:text-zinc-500">
                      Aucun produit trouvé.
                    </td>
                  </tr>
                )
              : sortedData.map((pos) => {
                  const level = getStockLevel(pos.quantity, pos.product.minimum_stock);
                  const badge = STOCK_BADGE[level];
                  return (
                    <tr
                      key={pos.id}
                      onClick={() => onRowClick(pos)}
                      className="cursor-pointer border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50 dark:border-zinc-800/50 dark:hover:bg-zinc-800/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-zinc-900 dark:text-zinc-50">{pos.product.name}</span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">{pos.product.sku}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {pos.warehouse.name}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          "font-numeric font-semibold",
                          level === "out_of_stock" ? "text-zinc-400 line-through"
                          : level === "critical" ? "text-rose-600 dark:text-rose-400"
                          : level === "low" ? "text-amber-600 dark:text-amber-400"
                          : "text-zinc-900 dark:text-zinc-50"
                        )}>
                          {formatQuantity(pos.quantity)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-numeric text-sm text-zinc-700 dark:text-zinc-300">
                        {formatFCFA(pos.product.selling_price)}
                      </td>
                      {canViewCost && (
                        <td className="px-4 py-3 text-right font-numeric text-sm text-zinc-500 dark:text-zinc-400">
                          {formatFCFA(pos.product.purchase_price)}
                        </td>
                      )}
                      {canViewCost && (
                        <td className="px-4 py-3 text-right font-numeric text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {formatFCFA(pos.quantity * pos.product.purchase_price)}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); onRowClick(pos); }}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                          aria-label="Voir le détail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Page {page} / {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Th({
  children,
  width,
  right = false,
}: {
  children?: React.ReactNode;
  width?: number;
  right?: boolean;
}) {
  return (
    <th
      style={width ? { width } : undefined}
      className={cn(
        "bg-zinc-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400",
        right ? "text-right" : "text-left"
      )}
    >
      {children}
    </th>
  );
}

function SortBtn({
  id,
  label,
  sortIcon,
  onSort,
  right = false,
}: {
  id: string;
  label: string;
  sortIcon: React.ReactNode;
  onSort: (id: string) => void;
  right?: boolean;
}) {
  return (
    <button
      onClick={() => onSort(id)}
      className={cn(
        "flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300",
        right && "ml-auto"
      )}
    >
      {label}
      {sortIcon}
    </button>
  );
}
