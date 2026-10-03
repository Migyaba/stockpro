import apiClient from "@/lib/api/client";
import type {
  Sale,
  SaleStatus,
  PaginatedResponse,
  CreateSalePayload,
  Customer,
  Product,
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

export async function fetchSale(id: string): Promise<Sale> {
  const { data } = await apiClient.get<Sale>(`/sales/${id}/`);
  return data;
}

export async function createSale(payload: CreateSalePayload): Promise<Sale> {
  const { data } = await apiClient.post<Sale>("/sales/", payload);
  return data;
}

export async function completeSale(id: string): Promise<Sale> {
  const { data } = await apiClient.post<Sale>(`/sales/${id}/complete/`);
  return data;
}

export async function cancelSale(id: string): Promise<Sale> {
  const { data } = await apiClient.post<Sale>(`/sales/${id}/cancel/`);
  return data;
}

export async function fetchCustomers(): Promise<Customer[]> {
  const { data } = await apiClient.get<PaginatedResponse<Customer> | Customer[]>(
    "/customers/?page_size=200"
  );
  return Array.isArray(data) ? data : data.results;
}

export async function fetchSaleProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<PaginatedResponse<Product> | Product[]>(
    "/products/?page_size=200&is_active=true"
  );
  return Array.isArray(data) ? data : data.results;
}
