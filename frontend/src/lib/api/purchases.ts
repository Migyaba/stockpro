import apiClient from "@/lib/api/client";
import type {
  Purchase,
  PurchaseStatus,
  PaginatedResponse,
  CreatePurchasePayload,
  ReceivePurchasePayload,
} from "@/lib/types/api";

export interface PurchaseFilters {
  page?: number;
  page_size?: number;
  search?: string;
  status?: PurchaseStatus | "";
  warehouse?: string;
  supplier?: string;
  ordering?: string;
}

export async function fetchPurchases(
  filters: PurchaseFilters = {}
): Promise<PaginatedResponse<Purchase>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== "") params.set(k, String(v));
  });
  const { data } = await apiClient.get<PaginatedResponse<Purchase>>(
    `/purchases/?${params.toString()}`
  );
  return data;
}

export async function fetchPurchaseDetail(id: string): Promise<Purchase> {
  const { data } = await apiClient.get<Purchase>(`/purchases/${id}/`);
  return data;
}

export async function createPurchase(
  payload: CreatePurchasePayload
): Promise<Purchase> {
  const { data } = await apiClient.post<Purchase>("/purchases/", payload);
  return data;
}

export async function confirmPurchase(id: string): Promise<Purchase> {
  const { data } = await apiClient.post<Purchase>(
    `/purchases/${id}/confirm/`
  );
  return data;
}

export async function receivePurchase(
  id: string,
  payload: ReceivePurchasePayload
): Promise<Purchase> {
  const { data } = await apiClient.post<Purchase>(
    `/purchases/${id}/receive/`,
    payload
  );
  return data;
}

export async function cancelPurchase(id: string): Promise<Purchase> {
  const { data } = await apiClient.post<Purchase>(`/purchases/${id}/cancel/`);
  return data;
}
