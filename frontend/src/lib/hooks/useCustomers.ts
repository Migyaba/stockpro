import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/lib/api/customers";
import type { CreateCustomerPayload } from "@/lib/types/api";

export const customerQueryKeys = {
  all: ["customers"] as const,
  lists: () => [...customerQueryKeys.all, "list"] as const,
  list: (filters?: { search?: string; is_active?: boolean }) =>
    [...customerQueryKeys.lists(), filters] as const,
};

export function useCustomers(filters?: { search?: string; is_active?: boolean }) {
  return useQuery({
    queryKey: customerQueryKeys.list(filters),
    queryFn: () => fetchCustomers(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) => createCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.all });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateCustomerPayload>;
    }) => updateCustomer(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.all });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.all });
    },
  });
}
