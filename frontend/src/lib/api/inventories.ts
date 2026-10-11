import apiClient, { idempotencyHeaders } from "@/lib/api/client";
import type {
  CountEntry,
  InventoryCount,
  InventoryLine,
  InventoryStatus,
  PaginatedResponse,
} from "@/lib/types/api";

export interface InventoryFilters {
  page?: number;
  page_size?: number;
  status?: InventoryStatus | "";
}

export interface LineFilters {
  page?: number;
  page_size?: number;
  search?: string;
  state?: "" | "counted" | "uncounted" | "difference";
}

function toParams(filters: object): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return params;
}

export async function fetchInventories(
  filters: InventoryFilters = {}
): Promise<PaginatedResponse<InventoryCount>> {
  const { data } = await apiClient.get(`/inventories/?${toParams(filters)}`);
  return data;
}

export async function fetchInventory(id: string): Promise<InventoryCount> {
  const { data } = await apiClient.get<InventoryCount>(`/inventories/${id}/`);
  return data;
}

export async function fetchInventoryLines(
  id: string,
  filters: LineFilters = {}
): Promise<PaginatedResponse<InventoryLine>> {
  const { data } = await apiClient.get(`/inventories/${id}/lines/?${toParams(filters)}`);
  return data;
}

// Crée l'inventaire puis ouvre le comptage (fige le stock théorique).
export async function createAndStartInventory(payload: {
  warehouse: string;
  category?: string | null;
  notes?: string;
}): Promise<InventoryCount> {
  const { data } = await apiClient.post<InventoryCount>("/inventories/", payload);
  const started = await apiClient.post<InventoryCount>(`/inventories/${data.id}/start/`);
  return started.data;
}

export async function recordCounts(id: string, lines: CountEntry[]): Promise<InventoryLine[]> {
  const { data } = await apiClient.post<InventoryLine[]>(`/inventories/${id}/lines/`, { lines });
  return data;
}

export async function inventoryAction(
  id: string,
  action: "review" | "reopen" | "validate" | "cancel"
): Promise<InventoryCount> {
  const { data } = await apiClient.post<InventoryCount>(`/inventories/${id}/${action}/`, undefined, {
    headers: action === "validate" ? idempotencyHeaders() : undefined,
  });
  return data;
}
