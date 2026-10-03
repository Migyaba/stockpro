import apiClient from "@/lib/api/client";
import type {
  Customer,
  PaginatedResponse,
  CreateCustomerPayload,
} from "@/lib/types/api";

export async function fetchCustomers(filters?: {
  search?: string;
  is_active?: boolean;
}): Promise<Customer[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.is_active !== undefined)
    params.set("is_active", String(filters.is_active));
  params.set("page_size", "100");

  const { data } = await apiClient.get<
    PaginatedResponse<Customer> | Customer[]
  >(`/customers/?${params.toString()}`);

  if (Array.isArray(data)) return data;
  if ("results" in data && Array.isArray(data.results)) return data.results;
  return [];
}

export async function createCustomer(
  payload: CreateCustomerPayload
): Promise<Customer> {
  const { data } = await apiClient.post<Customer>("/customers/", payload);
  return data;
}

export async function updateCustomer(
  id: string,
  payload: Partial<CreateCustomerPayload>
): Promise<Customer> {
  const { data } = await apiClient.patch<Customer>(`/customers/${id}/`, payload);
  return data;
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiClient.delete(`/customers/${id}/`);
}
