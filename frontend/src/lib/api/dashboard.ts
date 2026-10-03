import apiClient from "@/lib/api/client";
import type {
  DashboardKpis,
  PaginatedResponse,
  StockPosition,
  StockMovement,
} from "@/lib/types/api";

export async function fetchDashboardKpis(): Promise<DashboardKpis> {
  const { data } = await apiClient.get<DashboardKpis>("/dashboard/");
  return data;
}

export interface StockPositionFilters {
  page?: number;
  page_size?: number;
  search?: string;
  warehouse?: string;
  ordering?: string;
}

export async function fetchStockPositions(
  filters: StockPositionFilters = {}
): Promise<PaginatedResponse<StockPosition>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const { data } = await apiClient.get<PaginatedResponse<StockPosition>>(
    `/stock/?${params.toString()}`
  );
  return data;
}

export async function fetchProductMovements(
  productId: string,
  warehouseId?: string
): Promise<PaginatedResponse<StockMovement>> {
  const params = new URLSearchParams({ product: productId, page_size: "20" });
  if (warehouseId) params.set("warehouse", warehouseId);
  const { data } = await apiClient.get<PaginatedResponse<StockMovement>>(
    `/movements/?${params.toString()}`
  );
  return data;
}
