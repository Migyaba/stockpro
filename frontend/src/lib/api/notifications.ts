import apiClient from "@/lib/api/client";
import type {
  AppNotification,
  AuditEntry,
  NotificationKind,
  NotificationPreferences,
  PaginatedResponse,
  StockAlertPage,
} from "@/lib/types/api";

export async function fetchNotifications(unreadOnly = false): Promise<PaginatedResponse<AppNotification>> {
  const { data } = await apiClient.get("/notifications/", {
    params: { page_size: 15, ...(unreadOnly ? { unread: "1" } : {}) },
  });
  return data;
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>("/notifications/unread-count/");
  return data.count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.post(`/notifications/${id}/read/`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post("/notifications/read-all/");
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const { data } = await apiClient.get<NotificationPreferences>("/notifications/preferences/");
  return data;
}

export async function updateNotificationPreferences(
  email: Partial<Record<NotificationKind, boolean>>
): Promise<NotificationPreferences> {
  const { data } = await apiClient.patch<NotificationPreferences>("/notifications/preferences/", { email });
  return data;
}

export async function fetchStockAlerts(params: {
  kind?: "" | "out" | "low";
  warehouse?: string;
  page?: number;
  page_size?: number;
}): Promise<StockAlertPage> {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));
  const { data } = await apiClient.get<StockAlertPage>("/alerts/stock/", { params: clean });
  return data;
}

export async function fetchAuditLog(params: {
  page?: number;
  page_size?: number;
  action?: string;
  search?: string;
}): Promise<PaginatedResponse<AuditEntry>> {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));
  const { data } = await apiClient.get("/audit/", { params: clean });
  return data;
}
