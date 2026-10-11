import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCategories,
  fetchProducts,
  fetchProductsPage,
  createProduct,
  updateProduct,
  deactivateProduct,
  createCategory,
  updateCategory,
  type ProductListFilters,
} from "@/lib/api/products";
import type { ProductCreatePayload } from "@/lib/types/api";

export const productQueryKeys = {
  all: ["products"] as const,
  lists: () => [...productQueryKeys.all, "list"] as const,
  list: (filters?: { search?: string; is_active?: boolean }) =>
    [...productQueryKeys.lists(), filters] as const,
  categories: () => ["categories"] as const,
  allCategories: () => ["categories", "all"] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: productQueryKeys.categories(),
    queryFn: () => fetchCategories(),
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

export function useProductsPage(filters: ProductListFilters) {
  return useQuery({
    queryKey: [...productQueryKeys.all, "page", filters] as const,
    queryFn: () => fetchProductsPage(filters),
    staleTime: 30_000,
  });
}

function useInvalidateCatalog() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: productQueryKeys.categories() });
    queryClient.invalidateQueries({ queryKey: ["stock"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export function useUpdateProduct() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProductCreatePayload> }) =>
      updateProduct(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeactivateProduct() {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: deactivateProduct, onSuccess: invalidate });
}

export function useCreateCategory() {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: createCategory, onSuccess: invalidate });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; is_active?: boolean } }) =>
      updateCategory(id, payload),
    onSuccess: invalidate,
  });
}

// Gestion des catégories : y compris les désactivées, pour pouvoir les réactiver.
export function useAllCategories(enabled = true) {
  return useQuery({
    queryKey: productQueryKeys.allCategories(),
    queryFn: () => fetchCategories(true),
    enabled,
  });
}
