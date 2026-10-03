"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  cn,
  formatFCFA,
  formatQuantity,
  formatRelative,
  formatDatetime,
} from "@/lib/utils/format";
import { getStockLevel, type StockPosition, type StockMovement, type MovementType } from "@/lib/types/api";
import { useProductMovements } from "@/lib/hooks/useDashboard";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  RotateCcw,
  Boxes,
  AlertTriangle,
  Package,
  Warehouse,
  Tag,
  TrendingDown,
} from "lucide-react";

interface ProductSheetProps {
  position: StockPosition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MOVEMENT_CONFIG: Record<
  MovementType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    colorClass: string;
    sign: "+" | "-" | "→";
  }
> = {
  INITIAL: {
    label: "Stock initial",
    icon: Boxes,
    colorClass: "text-indigo-600 dark:text-indigo-400",
    sign: "+",
  },
  PURCHASE: {
    label: "Réception achat",
    icon: ArrowDownCircle,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    sign: "+",
  },
  SALE: {
    label: "Vente",
    icon: ArrowUpCircle,
    colorClass: "text-rose-600 dark:text-rose-400",
    sign: "-",
  },
  SALE_CANCEL: {
    label: "Annulation vente",
    icon: RotateCcw,
    colorClass: "text-amber-600 dark:text-amber-400",
    sign: "+",
  },
  TRANSFER_IN: {
    label: "Transfert entrant",
    icon: ArrowLeftRight,
    colorClass: "text-blue-600 dark:text-blue-400",
    sign: "+",
  },
  TRANSFER_OUT: {
    label: "Transfert sortant",
    icon: ArrowLeftRight,
    colorClass: "text-purple-600 dark:text-purple-400",
    sign: "-",
  },
  INVENTORY_ADJUSTMENT: {
    label: "Ajustement inventaire",
    icon: AlertTriangle,
    colorClass: "text-orange-600 dark:text-orange-400",
    sign: "+",
  },
  RETURN: {
    label: "Retour",
    icon: RotateCcw,
    colorClass: "text-teal-600 dark:text-teal-400",
    sign: "+",
  },
  DAMAGE: {
    label: "Perte / Casse",
    icon: TrendingDown,
    colorClass: "text-rose-700 dark:text-rose-500",
    sign: "-",
  },
  OTHER: {
    label: "Autre",
    icon: Package,
    colorClass: "text-zinc-500 dark:text-zinc-400",
    sign: "+",
  },
};

const STOCK_LEVEL_COLORS = {
  normal: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  low: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  critical: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  out_of_stock: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

const STOCK_LEVEL_LABELS = {
  normal: "Normal",
  low: "Faible",
  critical: "Critique",
  out_of_stock: "Rupture",
};

export function ProductSheet({ position, open, onOpenChange }: ProductSheetProps) {
  const { canViewCost } = useAuthStore();
  const { data: movementsPage, isLoading } = useProductMovements(
    position?.product.id ?? null,
    position?.warehouse.id
  );

  const movements = movementsPage?.results ?? [];
  const stockLevel = position
    ? getStockLevel(position.quantity, position.product.minimum_stock)
    : "normal";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col p-0 sm:max-w-xl">
        {/* Header */}
        <SheetHeader className="shrink-0">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="flex flex-col gap-1">
              <SheetTitle className="text-base">
                {position?.product.name ?? "Produit"}
              </SheetTitle>
              <SheetDescription className="text-xs">
                SKU : {position?.product.sku}
              </SheetDescription>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                STOCK_LEVEL_COLORS[stockLevel]
              )}
            >
              {STOCK_LEVEL_LABELS[stockLevel]}
            </span>
          </div>
        </SheetHeader>

        {/* Scroll content */}
        <ScrollArea className="flex-1 overflow-y-auto">
          {position && (
            <div className="flex flex-col gap-0">
              {/* Stock summary grid */}
              <div className="grid grid-cols-2 gap-px bg-zinc-200 dark:bg-zinc-800">
                <StatCell
                  icon={Boxes}
                  label="Quantité en stock"
                  value={formatQuantity(position.quantity)}
                  highlight={stockLevel !== "normal"}
                />
                <StatCell
                  icon={Warehouse}
                  label="Dépôt"
                  value={position.warehouse.name}
                />
                <StatCell
                  icon={Tag}
                  label="Prix de vente"
                  value={formatFCFA(position.product.selling_price)}
                />
                {canViewCost && (
                  <StatCell
                    icon={TrendingDown}
                    label="Prix d'achat"
                    value={formatFCFA(position.product.purchase_price)}
                    muted
                  />
                )}
                {canViewCost && (
                  <StatCell
                    icon={Package}
                    label="Valeur du stock"
                    value={formatFCFA(position.quantity * position.product.purchase_price)}
                    highlight
                  />
                )}
                <StatCell
                  icon={AlertTriangle}
                  label="Seuil d'alerte"
                  value={formatQuantity(position.product.minimum_stock)}
                  muted
                />
              </div>

              {/* Movements history */}
              <div className="px-6 pt-5">
                <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Historique des mouvements
                </h3>

                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3"
                      >
                        <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3.5 w-32 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                          <div className="h-3 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                        </div>
                        <div className="h-4 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                      </div>
                    ))}
                  </div>
                ) : movements.length === 0 ? (
                  <p className="py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
                    Aucun mouvement enregistré.
                  </p>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-3.5 top-0 h-full w-px bg-zinc-200 dark:bg-zinc-800" />

                    <div className="flex flex-col gap-4 pb-6">
                      {movements.map((m) => (
                        <MovementRow key={m.id} movement={m} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function StatCell({
  icon: Icon,
  label,
  value,
  highlight = false,
  muted = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 bg-white px-6 py-4 dark:bg-zinc-900">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-zinc-400" />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      </div>
      <span
        className={cn(
          "font-numeric text-lg font-semibold",
          highlight
            ? "text-indigo-700 dark:text-indigo-400"
            : muted
            ? "text-zinc-500 dark:text-zinc-400"
            : "text-zinc-900 dark:text-zinc-50"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function MovementRow({ movement }: { movement: StockMovement }) {
  const config = MOVEMENT_CONFIG[movement.type] ?? MOVEMENT_CONFIG.OTHER;
  const Icon = config.icon;
  const isPositive = movement.quantity > 0;

  return (
    <div className="relative flex items-start gap-3 pl-1">
      {/* Icon bubble on timeline */}
      <div
        className={cn(
          "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", config.colorClass)} />
      </div>

      <div className="flex flex-1 items-start justify-between gap-2 pt-0.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {config.label}
          </span>
          {movement.reason && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {movement.reason}
            </span>
          )}
          <span
            className="text-[11px] text-zinc-400 dark:text-zinc-500"
            title={formatDatetime(movement.created_at)}
          >
            {formatRelative(movement.created_at)}
          </span>
        </div>

        <span
          className={cn(
            "font-numeric shrink-0 text-sm font-semibold",
            isPositive
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          )}
        >
          {isPositive ? "+" : ""}
          {formatQuantity(movement.quantity)}
        </span>
      </div>
    </div>
  );
}
