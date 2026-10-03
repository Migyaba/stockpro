"use client";

import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Building2,
  AlertTriangle,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils/format";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useDashboardKpis } from "@/lib/hooks/useDashboard";
import { useRouter } from "next/navigation";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMINISTRATOR: "Administrateur",
  MANAGER: "Manager",
  STAFF: "Vendeur",
};

const ROLE_BADGE_VARIANT: Record<
  string,
  "default" | "secondary" | "warning" | "success"
> = {
  OWNER: "default",
  ADMINISTRATOR: "default",
  MANAGER: "success",
  STAFF: "secondary",
};

interface HeaderProps {
  pageTitle?: string;
}

export function Header({ pageTitle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const {
    user,
    role,
    organization,
    activeWarehouse,
    warehouses,
    setActiveWarehouse,
    logout,
  } = useAuthStore();
  const { data: kpis } = useDashboardKpis();

  const lowStockCount = kpis?.low_stock_count ?? 0;

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Left: page title */}
      <div className="flex items-center gap-3">
        {pageTitle && (
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {pageTitle}
          </h1>
        )}
      </div>

      {/* Center: Tenant + warehouse selector */}
      <div className="flex items-center gap-2">
        {organization && (
          <div className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-800">
            <Building2 className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
            <span className="max-w-[120px] truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {organization.name}
            </span>
          </div>
        )}

        {/* Warehouse selector */}
        {warehouses.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                <Warehouse className="h-3.5 w-3.5 text-zinc-500" />
                <span className="max-w-[100px] truncate">
                  {activeWarehouse?.name ?? "Dépôt"}
                </span>
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              <DropdownMenuLabel>Choisir un dépôt</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {warehouses.map((w) => (
                <DropdownMenuItem
                  key={w.id}
                  onClick={() => setActiveWarehouse(w)}
                  className={cn(
                    activeWarehouse?.id === w.id &&
                      "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  )}
                >
                  {w.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Right: notifications + theme + profile */}
      <div className="flex items-center gap-1">
        {/* Stock alert bell */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          aria-label="Alertes stock"
        >
          <Bell className="h-4 w-4" />
          {lowStockCount > 0 && (
            <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
              {lowStockCount > 9 ? "9+" : lowStockCount}
            </span>
          )}
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          aria-label="Basculer le thème"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* User profile menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                <span className="text-xs font-semibold">
                  {user?.first_name?.[0]?.toUpperCase() ?? "U"}
                </span>
              </div>
              <div className="hidden flex-col items-start md:flex">
                <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
                  {user?.full_name ?? user?.email ?? "Utilisateur"}
                </span>
                {role && (
                  <Badge
                    variant={ROLE_BADGE_VARIANT[role] ?? "secondary"}
                    className="mt-0.5 h-4 px-1 py-0 text-[10px]"
                  >
                    {ROLE_LABELS[role] ?? role}
                  </Badge>
                )}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">
                  {user?.full_name ?? user?.email}
                </span>
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="h-4 w-4" />
              Mon profil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Building2 className="h-4 w-4" />
              Organisation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-rose-600 focus:bg-rose-50 focus:text-rose-700 dark:text-rose-400 dark:focus:bg-rose-950"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
