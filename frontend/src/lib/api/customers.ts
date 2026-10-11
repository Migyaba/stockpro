import apiClient, { fetchAllPages } from "@/lib/api/client";
import type {
  Customer,
  CreateCustomerPayload,
} from "@/lib/types/api";

export async function fetchCustomers(filters?: {
  search?: string;
  is_active?: boolean;
}): Promise<Customer[]> {
  const params: Record<string, string> = {};
  if (filters?.search) params.search = filters.search;
  if (filters?.is_active !== undefined) params.is_active = String(filters.is_active);
  return fetchAllPages<Customer>("/customers/", params);
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
