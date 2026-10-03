import apiClient from "@/lib/api/client";
import type {
  Warehouse,
  PaginatedResponse,
  CreateWarehousePayload,
} from "@/lib/types/api";

export async function fetchWarehouses(): Promise<Warehouse[]> {
  const { data } = await apiClient.get<
    PaginatedResponse<Warehouse> | Warehouse[]
  >("/warehouses/?page_size=100");

  if (Array.isArray(data)) return data;
  if ("results" in data && Array.isArray(data.results)) return data.results;
  return [];
}

export async function createWarehouse(
  payload: CreateWarehousePayload
): Promise<Warehouse> {
  const { data } = await apiClient.post<Warehouse>("/warehouses/", payload);
  return data;
}

export async function updateWarehouse(
  id: string,
  payload: Partial<CreateWarehousePayload>
): Promise<Warehouse> {
  const { data } = await apiClient.patch<Warehouse>(`/warehouses/${id}/`, payload);
  return data;
}

export async function toggleWarehouseActive(
  id: string,
  is_active: boolean
): Promise<Warehouse> {
  return updateWarehouse(id, { is_active });
}
