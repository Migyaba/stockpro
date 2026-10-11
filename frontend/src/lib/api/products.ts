import apiClient, { fetchAllPages } from "@/lib/api/client";
import type {
  Product,
  Category,
  PaginatedResponse,
  ProductCreatePayload,
} from "@/lib/types/api";

export async function fetchCategories(includeInactive = false): Promise<Category[]> {
  return fetchAllPages<Category>("/categories/", includeInactive ? {} : { is_active: "true" });
}

export async function fetchProducts(filters?: {
  search?: string;
  is_active?: boolean;
}): Promise<Product[]> {
  const params: Record<string, string> = {};
  if (filters?.search) params.search = filters.search;
  if (filters?.is_active !== undefined) params.is_active = String(filters.is_active);
  return fetchAllPages<Product>("/products/", params);
}

export async function createProduct(payload: ProductCreatePayload): Promise<Product> {
  const { data } = await apiClient.post<Product>("/products/", payload);
  return data;
}

export interface ProductListFilters {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  category?: string;
  ordering?: string;
}

export async function fetchProductsPage(
  filters: ProductListFilters = {}
): Promise<PaginatedResponse<Product>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const { data } = await apiClient.get<PaginatedResponse<Product>>(`/products/?${params.toString()}`);
  return data;
}

export async function updateProduct(
  id: string,
  payload: Partial<ProductCreatePayload>
): Promise<Product> {
  const { data } = await apiClient.patch<Product>(`/products/${id}/`, payload);
  return data;
}

// Désactivation logique (le produit garde son historique, cf. §19.2).
export async function deactivateProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}/`);
}

export async function createCategory(name: string): Promise<Category> {
  const { data } = await apiClient.post<Category>("/categories/", { name });
  return data;
}

export async function updateCategory(
  id: string,
  payload: { name?: string; is_active?: boolean }
): Promise<Category> {
  const { data } = await apiClient.patch<Category>(`/categories/${id}/`, payload);
  return data;
}
