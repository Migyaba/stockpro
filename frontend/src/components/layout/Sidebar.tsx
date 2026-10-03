"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Boxes,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils/format";
import { useAuthStore } from "@/lib/stores/authStore";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Ventes", href: "/ventes", icon: ShoppingCart },
  { label: "Stock", href: "/stock", icon: Boxes },
  { label: "Achats", href: "/achats", icon: Truck },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "Rapports", href: "/rapports", icon: BarChart3 },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: "Paramètres", href: "/parametres", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { organization } = useAuthStore();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      className={cn(
        "sidebar-transition flex h-full flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-zinc-200 dark:border-zinc-800",
          collapsed ? "justify-center px-0" : "px-4"
        )}
      >
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Package className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Package className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                STOCKPRO
              </span>
              {organization && (
                <span className="max-w-[140px] truncate text-[10px] text-zinc-500 dark:text-zinc-400">
                  {organization.name}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={isActive(item.href)}
          />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="flex flex-col gap-0.5 border-t border-zinc-200 p-2 dark:border-zinc-800">
        {BOTTOM_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={isActive(item.href)}
          />
        ))}

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className={cn(
            "mt-1 flex h-9 w-full items-center rounded-md px-2 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
            collapsed ? "justify-center" : "gap-2"
          )}
          aria-label={collapsed ? "Déplier la barre" : "Réduire la barre"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span>Réduire</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({
  item,
  collapsed,
  active,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group flex h-9 items-center gap-2.5 rounded-md px-2 text-sm font-medium transition-colors",
        active
          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
        collapsed && "justify-center"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-300"
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.badge !== undefined && item.badge > 0 && (
        <span className="ml-auto rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
