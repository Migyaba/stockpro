import apiClient, { fetchAllPages } from "@/lib/api/client";
import type {
  Product,
  Category,
  ProductCreatePayload,
} from "@/lib/types/api";

export async function fetchCategories(): Promise<Category[]> {
  return fetchAllPages<Category>("/categories/", { is_active: "true" });
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
