"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAuditLog,
  fetchNotifications,
  fetchStockAlerts,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications";

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadCount,
    refetchInterval: 60_000,
  });
}

export function useNotifications(enabled: boolean) {
  return useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => fetchNotifications(),
    enabled,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id?: string) => (id ? markNotificationRead(id) : markAllNotificationsRead()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useStockAlerts(
  params: Parameters<typeof fetchStockAlerts>[0],
  options: { enabled?: boolean; refetchInterval?: number } = {}
) {
  return useQuery({
    queryKey: ["stock", "alerts", params],
    queryFn: () => fetchStockAlerts(params),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useAuditLog(params: Parameters<typeof fetchAuditLog>[0], enabled: boolean) {
  return useQuery({
    queryKey: ["audit", params],
    queryFn: () => fetchAuditLog(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}
