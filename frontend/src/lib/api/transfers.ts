import apiClient, { fetchAllPages, idempotencyHeaders } from "@/lib/api/client";
import type {
  CreateTransferPayload,
  PaginatedResponse,
  StockPosition,
  Transfer,
  TransferStatus,
} from "@/lib/types/api";

export interface TransferFilters {
  page?: number;
  page_size?: number;
  status?: TransferStatus | "";
}

export async function fetchTransfers(
  filters: TransferFilters = {}
): Promise<PaginatedResponse<Transfer>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const { data } = await apiClient.get<PaginatedResponse<Transfer>>(
    `/transfers/?${params.toString()}`
  );
  return data;
}

export async function createTransfer(payload: CreateTransferPayload): Promise<Transfer> {
  const { data } = await apiClient.post<Transfer>("/transfers/", payload);
  return data;
}

export async function completeTransfer(id: string): Promise<Transfer> {
  const { data } = await apiClient.post<Transfer>(`/transfers/${id}/complete/`, undefined, {
    headers: idempotencyHeaders(),
  });
  return data;
}

export async function cancelTransfer(id: string): Promise<Transfer> {
  const { data } = await apiClient.post<Transfer>(`/transfers/${id}/cancel/`);
  return data;
}

// Stock disponible d'un dépôt, pour guider la saisie des quantités à transférer.
export async function fetchWarehouseStock(warehouseId: string): Promise<StockPosition[]> {
  return fetchAllPages<StockPosition>("/stock/", { warehouse: warehouseId });
}
