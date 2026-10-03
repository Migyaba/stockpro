import apiClient from "@/lib/api/client";
import type {
  Product,
  Category,
  PaginatedResponse,
  ProductCreatePayload,
} from "@/lib/types/api";

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<PaginatedResponse<Category> | Category[]>(
    "/categories/?is_active=true&page_size=100"
  );
  if (Array.isArray(data)) return data;
  if ("results" in data && Array.isArray(data.results)) return data.results;
  return [];
}

export async function fetchProducts(filters?: {
  search?: string;
  is_active?: boolean;
}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.is_active !== undefined)
    params.set("is_active", String(filters.is_active));
  params.set("page_size", "100");

  const { data } = await apiClient.get<PaginatedResponse<Product> | Product[]>(
    `/products/?${params.toString()}`
  );
  if (Array.isArray(data)) return data;
  if ("results" in data && Array.isArray(data.results)) return data.results;
  return [];
}

export async function createProduct(payload: ProductCreatePayload): Promise<Product> {
  const { data } = await apiClient.post<Product>("/products/", payload);
  return data;
}
