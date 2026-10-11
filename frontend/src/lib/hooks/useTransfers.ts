"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelTransfer,
  completeTransfer,
  createTransfer,
  fetchTransfers,
  fetchWarehouseStock,
  type TransferFilters,
} from "@/lib/api/transfers";
import type { CreateTransferPayload } from "@/lib/types/api";

const TRANSFERS_KEY = "transfers";

export function useTransfers(filters: TransferFilters = {}) {
  return useQuery({
    queryKey: [TRANSFERS_KEY, filters],
    queryFn: () => fetchTransfers(filters),
    staleTime: 30_000,
  });
}

export function useWarehouseStock(warehouseId: string) {
  return useQuery({
    queryKey: ["stock", "warehouse", warehouseId],
    queryFn: () => fetchWarehouseStock(warehouseId),
    enabled: !!warehouseId,
    staleTime: 15_000,
  });
}

// Un transfert validé déplace du stock : on rafraîchit aussi stock et dashboard.
function useInvalidateAfterTransfer() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [TRANSFERS_KEY] });
    queryClient.invalidateQueries({ queryKey: ["stock"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export function useCreateTransfer() {
  const invalidate = useInvalidateAfterTransfer();
  return useMutation({
    mutationFn: (payload: CreateTransferPayload) => createTransfer(payload),
    onSuccess: invalidate,
  });
}

export function useCompleteTransfer() {
  const invalidate = useInvalidateAfterTransfer();
  return useMutation({ mutationFn: completeTransfer, onSuccess: invalidate });
}

export function useCancelTransfer() {
  const invalidate = useInvalidateAfterTransfer();
  return useMutation({ mutationFn: cancelTransfer, onSuccess: invalidate });
}
