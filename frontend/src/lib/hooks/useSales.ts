"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSales,
  fetchSale,
  createSale,
  completeSale,
  cancelSale,
  fetchCustomers,
  fetchSaleProducts,
  type SaleFilters,
} from "@/lib/api/sales";
import type { CreateSalePayload } from "@/lib/types/api";

export const SALES_QUERY_KEY = "sales";

export function useSales(filters: SaleFilters = {}) {
  return useQuery({
    queryKey: [SALES_QUERY_KEY, filters],
    queryFn: () => fetchSales(filters),
    staleTime: 30_000,
  });
}

export function useSale(id: string | null) {
  return useQuery({
    queryKey: [SALES_QUERY_KEY, id],
    queryFn: () => fetchSale(id!),
    enabled: !!id,
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
    staleTime: 60_000,
  });
}

export function useSaleProducts() {
  return useQuery({
    queryKey: ["products", "for-sales"],
    queryFn: fetchSaleProducts,
    staleTime: 60_000,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSalePayload) => createSale(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCompleteSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => completeSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}

export function useCancelSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}
