"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bell, ClipboardCheck, PackageCheck, ArrowRightLeft, PackageX } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/stores/authStore";
import { cn, formatRelative } from "@/lib/utils/format";
import {
  useMarkNotificationRead,
  useNotifications,
  useStockAlerts,
  useUnreadCount,
} from "@/lib/hooks/useNotifications";
import type { AppNotification } from "@/lib/types/api";

const ICONS: Record<AppNotification["kind"], React.ComponentType<{ className?: string }>> = {
  STOCK_LOW: AlertTriangle,
  STOCK_OUT: PackageX,
  PURCHASE_RECEIVED: PackageCheck,
  TRANSFER_COMPLETED: ArrowRightLeft,
  INVENTORY_REVIEW: ClipboardCheck,
};

export function NotificationBell() {
  const router = useRouter();
  const canViewStock = useAuthStore((s) => s.permissions.includes("stock.view"));
  const [open, setOpen] = useState(false);
  const { data: unread = 0 } = useUnreadCount();
  const { data: notifications } = useNotifications(open);
  const { data: alerts } = useStockAlerts(
    { page_size: 1 },
    { enabled: canViewStock, refetchInterval: 120_000 }
  );
  const markRead = useMarkNotificationRead();
  const alertCount = (alerts?.summary.out ?? 0) + (alerts?.summary.low ?? 0);
  const badge = unread;

  function openNotification(n: AppNotification) {
    if (!n.read_at) markRead.mutate(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          aria-label={badge > 0 ? `Notifications (${badge} non lues)` : "Notifications"}
        >
          <Bell className="h-4 w-4" />
          {badge > 0 && (
            <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[9px] font-bold text-white">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Notifications</span>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markRead.mutate(undefined)}
              className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        {canViewStock && alertCount > 0 && (
          <Link
            href="/stock/alertes"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 border-b border-zinc-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 hover:bg-amber-100 dark:border-zinc-800 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {alerts!.summary.out} rupture{alerts!.summary.out > 1 ? "s" : ""} · {alerts!.summary.low} stock
              {alerts!.summary.low > 1 ? "s" : ""} faible{alerts!.summary.low > 1 ? "s" : ""} — voir les alertes
            </span>
          </Link>
        )}

        <div className="max-h-96 overflow-y-auto">
          {!notifications ? (
            <p className="p-4 text-center text-xs text-zinc-500">Chargement…</p>
          ) : notifications.results.length === 0 ? (
            <p className="p-6 text-center text-xs text-zinc-500">Aucune notification.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {notifications.results.map((n) => {
                const Icon = ICONS[n.kind] ?? Bell;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openNotification(n)}
                      className={cn(
                        "flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
                        !n.read_at && "bg-indigo-50/60 dark:bg-indigo-950/30"
                      )}
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block text-xs",
                            n.read_at ? "text-zinc-600 dark:text-zinc-400" : "font-medium text-zinc-900 dark:text-zinc-100"
                          )}
                        >
                          {n.message}
                        </span>
                        <span className="text-[10px] text-zinc-400">{formatRelative(n.created_at)}</span>
                      </span>
                      {!n.read_at && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" aria-label="Non lue" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
