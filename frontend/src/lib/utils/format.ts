import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Monetary formatting ───────────────────────────────────────────────────
const FCFA_FORMATTER = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatFCFA(amount: number): string {
  // DRF stores amounts as integers (no decimals for XOF)
  return FCFA_FORMATTER.format(amount).replace("XOF", "FCFA").trim();
}

export function formatFCFAShort(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M FCFA`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} k FCFA`;
  }
  return formatFCFA(amount);
}

// ─── Date formatting ───────────────────────────────────────────────────────
const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(dateStr: string): string {
  return DATE_FORMATTER.format(new Date(dateStr));
}

export function formatDatetime(dateStr: string): string {
  return DATETIME_FORMATTER.format(new Date(dateStr));
}

export function formatTime(dateStr: string): string {
  return TIME_FORMATTER.format(new Date(dateStr));
}

export function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD < 7) return `Il y a ${diffD}j`;
  return formatDate(dateStr);
}

// ─── Number helpers ────────────────────────────────────────────────────────
export function formatQuantity(qty: number): string {
  return qty.toLocaleString("fr-FR");
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toLocaleString("fr-FR", { maximumFractionDigits: decimals })} %`;
}
