import apiClient, { fetchAllPages, idempotencyHeaders } from "@/lib/api/client";
import type {
  Sale,
  SaleStatus,
  PaginatedResponse,
  CreateSalePayload,
  Customer,
  Product,
  SalesSummary,
} from "@/lib/types/api";

export interface SaleFilters {
  page?: number;
  page_size?: number;
  search?: string;
  status?: SaleStatus | "";
  warehouse?: string;
  ordering?: string;
}

export async function fetchSales(
  filters: SaleFilters = {}
): Promise<PaginatedResponse<Sale>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const { data } = await apiClient.get<PaginatedResponse<Sale>>(
    `/sales/?${params.toString()}`
  );
  return data;
}

export async function fetchSalesSummary(
  filters: Pick<SaleFilters, "search" | "warehouse"> = {}
): Promise<SalesSummary> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, String(value));
  });
  const { data } = await apiClient.get<SalesSummary>(`/sales/summary/?${params.toString()}`);
  return data;
}

export async function fetchSale(id: string): Promise<Sale> {
  const { data } = await apiClient.get<Sale>(`/sales/${id}/`);
  return data;
}

export async function createSale(payload: CreateSalePayload): Promise<Sale> {
  const { data } = await apiClient.post<Sale>("/sales/", payload);
  return data;
}

export async function completeSale(id: string): Promise<Sale> {
  const { data } = await apiClient.post<Sale>(`/sales/${id}/complete/`, undefined, {
    headers: idempotencyHeaders(),
  });
  return data;
}

export async function cancelSale(id: string): Promise<Sale> {
  const { data } = await apiClient.post<Sale>(`/sales/${id}/cancel/`);
  return data;
}

export async function fetchCustomers(): Promise<Customer[]> {
  return fetchAllPages<Customer>("/customers/", { is_active: "true" });
}

export async function fetchSaleProducts(): Promise<Product[]> {
  return fetchAllPages<Product>("/products/", { is_active: "true" });
}
