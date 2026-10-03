import apiClient from "@/lib/api/client";
import type {
  Supplier,
  PaginatedResponse,
  CreateSupplierPayload,
} from "@/lib/types/api";

export async function fetchSuppliers(filters?: {
  search?: string;
  is_active?: boolean;
}): Promise<Supplier[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.is_active !== undefined)
    params.set("is_active", String(filters.is_active));
  params.set("page_size", "100");

  const { data } = await apiClient.get<
    PaginatedResponse<Supplier> | Supplier[]
  >(`/suppliers/?${params.toString()}`);

  if (Array.isArray(data)) return data;
  if ("results" in data && Array.isArray(data.results)) return data.results;
  return [];
}

export async function createSupplier(
  payload: CreateSupplierPayload
): Promise<Supplier> {
  const { data } = await apiClient.post<Supplier>("/suppliers/", payload);
  return data;
}
