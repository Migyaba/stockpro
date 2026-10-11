import apiClient, { fetchAllPages } from "@/lib/api/client";
import type {
  Supplier,
  CreateSupplierPayload,
} from "@/lib/types/api";

export async function fetchSuppliers(filters?: {
  search?: string;
  is_active?: boolean;
}): Promise<Supplier[]> {
  const params: Record<string, string> = {};
  if (filters?.search) params.search = filters.search;
  if (filters?.is_active !== undefined) params.is_active = String(filters.is_active);
  return fetchAllPages<Supplier>("/suppliers/", params);
}

export async function createSupplier(
  payload: CreateSupplierPayload
): Promise<Supplier> {
  const { data } = await apiClient.post<Supplier>("/suppliers/", payload);
  return data;
}
