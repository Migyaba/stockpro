import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchPurchases,
  fetchPurchaseDetail,
  createPurchase,
  confirmPurchase,
  receivePurchase,
  cancelPurchase,
  type PurchaseFilters,
} from "@/lib/api/purchases";
import type {
  CreatePurchasePayload,
  ReceivePurchasePayload,
} from "@/lib/types/api";

export const purchaseQueryKeys = {
  all: ["purchases"] as const,
  lists: () => [...purchaseQueryKeys.all, "list"] as const,
  list: (filters: PurchaseFilters) =>
    [...purchaseQueryKeys.lists(), filters] as const,
  details: () => [...purchaseQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...purchaseQueryKeys.details(), id] as const,
};

export function usePurchases(filters: PurchaseFilters = {}) {
  return useQuery({
    queryKey: purchaseQueryKeys.list(filters),
    queryFn: () => fetchPurchases(filters),
    staleTime: 1000 * 30,
  });
}

export function usePurchaseDetail(id: string | null) {
  return useQuery({
    queryKey: purchaseQueryKeys.detail(id ?? ""),
    queryFn: () => fetchPurchaseDetail(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePurchasePayload) => createPurchase(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.all });
    },
  });
}

export function useConfirmPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => confirmPurchase(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.detail(id) });
    },
  });
}

export function useReceivePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ReceivePurchasePayload;
    }) => receivePurchase(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCancelPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelPurchase(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.detail(id) });
    },
  });
}
