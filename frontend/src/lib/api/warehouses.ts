import apiClient from "@/lib/api/client";
import type {
  Warehouse,
  CreateWarehousePayload,
  PaginatedResponse,
} from "@/lib/types/api";

const MOCK_WAREHOUSES: Warehouse[] = [
  {
    id: "wh-001",
    name: "Dépôt Central (Zone Portuaire)",
    code: "DEP-CENTRAL",
    address: "Boulevard de la Marina, Zone Portuaire",
    city: "Cotonou",
    manager_name: "Alain Gbaguidi",
    is_active: true,
  },
  {
    id: "wh-002",
    name: "Boutique Marché Dantokpa",
    code: "MAG-DANTOKPA",
    address: "Hangar 4B, Grand Marché",
    city: "Cotonou",
    manager_name: "Mireille Houessou",
    is_active: true,
  },
  {
    id: "wh-003",
    name: "Point de Vente Calavi Kpota",
    code: "PV-CALAVI",
    address: "Carrefour Kpota, RNIE 2",
    city: "Abomey-Calavi",
    manager_name: "Boris Kpadonou",
    is_active: true,
  },
];

let mockWarehouses: Warehouse[] = [...MOCK_WAREHOUSES];

export async function fetchWarehouses(): Promise<Warehouse[]> {
  try {
    const { data } = await apiClient.get<
      PaginatedResponse<Warehouse> | Warehouse[]
    >("/warehouses/");

    if (Array.isArray(data)) return data;
    if ("results" in data && Array.isArray(data.results)) return data.results;
    return mockWarehouses;
  } catch {
    return mockWarehouses;
  }
}

export async function createWarehouse(
  payload: CreateWarehousePayload
): Promise<Warehouse> {
  try {
    const { data } = await apiClient.post<Warehouse>("/warehouses/", payload);
    return data;
  } catch (error) {
    console.warn("Backend /warehouses/ offline, creating simulated warehouse", error);
    const newWh: Warehouse = {
      id: `wh-${Date.now()}`,
      name: payload.name,
      code: payload.code.toUpperCase(),
      address: payload.address || "",
      city: payload.city || "Cotonou",
      manager_name: payload.manager_name || "",
      is_active: payload.is_active ?? true,
    };
    mockWarehouses.push(newWh);
    return newWh;
  }
}

export async function updateWarehouse(
  id: string,
  payload: Partial<CreateWarehousePayload>
): Promise<Warehouse> {
  try {
    const { data } = await apiClient.patch<Warehouse>(`/warehouses/${id}/`, payload);
    return data;
  } catch (error) {
    console.warn("Backend /warehouses/ offline, updating simulated warehouse", error);
    const idx = mockWarehouses.findIndex((w) => w.id === id);
    if (idx !== -1) {
      mockWarehouses[idx] = { ...mockWarehouses[idx], ...payload };
      return mockWarehouses[idx];
    }
    throw error;
  }
}

export async function toggleWarehouseActive(
  id: string,
  is_active: boolean
): Promise<Warehouse> {
  return updateWarehouse(id, { is_active });
}
