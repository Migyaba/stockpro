"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  fetchDashboardKpis,
  fetchStockPositions,
  fetchProductMovements,
  type StockPositionFilters,
} from "@/lib/api/dashboard";

// ─── Query keys ───────────────────────────────────────────────────────────
export const queryKeys = {
  kpis: ["dashboard", "kpis"] as const,
  stockPositions: (filters: StockPositionFilters) =>
    ["stock", "positions", filters] as const,
  productMovements: (productId: string, warehouseId?: string) =>
    ["stock", "movements", productId, warehouseId] as const,
};

// ─── Dashboard KPIs ───────────────────────────────────────────────────────
export function useDashboardKpis() {
  return useQuery({
    queryKey: queryKeys.kpis,
    queryFn: fetchDashboardKpis,
    refetchInterval: 60_000, // auto-refresh every minute
    staleTime: 30_000,
  });
}

// ─── Stock positions (table) ───────────────────────────────────────────────
export function useStockPositions(filters: StockPositionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.stockPositions(filters),
    queryFn: () => fetchStockPositions(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// ─── Product stock movements ───────────────────────────────────────────────
export function useProductMovements(
  productId: string | null,
  warehouseId?: string
) {
  return useQuery({
    queryKey: queryKeys.productMovements(productId ?? "", warehouseId),
    queryFn: () => fetchProductMovements(productId!, warehouseId),
    enabled: !!productId,
    staleTime: 15_000,
  });
}
