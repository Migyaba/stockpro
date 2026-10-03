import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSuppliers, createSupplier } from "@/lib/api/suppliers";
import type { CreateSupplierPayload } from "@/lib/types/api";

export const supplierQueryKeys = {
  all: ["suppliers"] as const,
  lists: () => [...supplierQueryKeys.all, "list"] as const,
  list: (filters?: { search?: string; is_active?: boolean }) =>
    [...supplierQueryKeys.lists(), filters] as const,
};

export function useSuppliers(filters?: { search?: string; is_active?: boolean }) {
  return useQuery({
    queryKey: supplierQueryKeys.list(filters),
    queryFn: () => fetchSuppliers(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSupplierPayload) => createSupplier(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierQueryKeys.all });
    },
  });
}
