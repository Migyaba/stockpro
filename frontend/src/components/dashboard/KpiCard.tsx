"use client";

import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn, formatPercent } from "@/lib/utils/format";

interface KpiCardProps {
  label: string;
  value: string;
  subValue?: string;
  changePct?: number | null;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  loading?: boolean;
  alert?: boolean;
}

export function KpiCard({
  label,
  value,
  subValue,
  changePct,
  icon: Icon,
  iconColor = "text-indigo-600 dark:text-indigo-400",
  iconBg = "bg-indigo-50 dark:bg-indigo-950",
  loading = false,
  alert = false,
}: KpiCardProps) {
  const trendPositive = changePct !== undefined && changePct !== null && changePct > 0;
  const trendNegative = changePct !== undefined && changePct !== null && changePct < 0;
  const TrendIcon = trendPositive ? TrendingUp : trendNegative ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-zinc-900",
        alert
          ? "border-rose-200 dark:border-rose-900"
          : "border-zinc-200 dark:border-zinc-800"
      )}
    >
      {/* Alert pulse indicator */}
      {alert && (
        <span className="absolute right-3 top-3 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
        </span>
      )}

      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {label}
          </span>

          {loading ? (
            <div className="space-y-1.5">
              <div className="h-7 w-32 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-4 w-20 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
            </div>
          ) : (
            <>
              <span className="font-numeric text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {value}
              </span>
              {subValue && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {subValue}
                </span>
              )}
            </>
          )}
        </div>

        <div className={cn("rounded-lg p-2.5", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </div>

      {/* Trend indicator */}
      {changePct !== undefined && changePct !== null && !loading && (
        <div
          className={cn(
            "mt-3 flex items-center gap-1 text-xs font-medium",
            trendPositive
              ? "text-emerald-600 dark:text-emerald-400"
              : trendNegative
              ? "text-rose-600 dark:text-rose-400"
              : "text-zinc-500 dark:text-zinc-400"
          )}
        >
          <TrendIcon className="h-3.5 w-3.5" />
          <span>{formatPercent(changePct)} vs hier</span>
        </div>
      )}
    </div>
  );
}
