import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCategories,
  fetchProducts,
  createProduct,
} from "@/lib/api/products";
import type { ProductCreatePayload } from "@/lib/types/api";
import { queryKeys as dashboardQueryKeys } from "@/lib/hooks/useDashboard";

export const productQueryKeys = {
  all: ["products"] as const,
  lists: () => [...productQueryKeys.all, "list"] as const,
  list: (filters?: { search?: string; is_active?: boolean }) =>
    [...productQueryKeys.lists(), filters] as const,
  categories: () => ["categories"] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: productQueryKeys.categories(),
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 10,
  });
}

export function useProducts(filters?: { search?: string; is_active?: boolean }) {
  return useQuery({
    queryKey: productQueryKeys.list(filters),
    queryFn: () => fetchProducts(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProductCreatePayload) => createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
