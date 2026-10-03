import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchWarehouses,
  createWarehouse,
  updateWarehouse,
  toggleWarehouseActive,
} from "@/lib/api/warehouses";
import type { CreateWarehousePayload } from "@/lib/types/api";

export const warehouseQueryKeys = {
  all: ["warehouses"] as const,
};

export function useWarehouses() {
  return useQuery({
    queryKey: warehouseQueryKeys.all,
    queryFn: () => fetchWarehouses(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWarehousePayload) => createWarehouse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseQueryKeys.all });
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateWarehousePayload>;
    }) => updateWarehouse(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseQueryKeys.all });
    },
  });
}

export function useToggleWarehouseActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleWarehouseActive(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseQueryKeys.all });
    },
  });
}
