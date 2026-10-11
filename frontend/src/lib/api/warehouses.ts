import apiClient, { fetchAllPages } from "@/lib/api/client";
import type {
  Warehouse,
  CreateWarehousePayload,
} from "@/lib/types/api";

export async function fetchWarehouses(): Promise<Warehouse[]> {
  return fetchAllPages<Warehouse>("/warehouses/");
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
