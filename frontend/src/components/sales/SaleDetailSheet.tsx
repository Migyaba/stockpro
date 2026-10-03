"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  User,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { formatFCFA, formatDate } from "@/lib/utils/format";
import { useAuthStore } from "@/lib/stores/authStore";
import { useCompleteSale, useCancelSale } from "@/lib/hooks/useSales";
import type { Sale } from "@/lib/types/api";

interface SaleDetailSheetProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleDetailSheet({
  sale,
  open,
  onOpenChange,
}: SaleDetailSheetProps) {
  const { canCancelSale } = useAuthStore();
  const completeMutation = useCompleteSale();
  const cancelMutation = useCancelSale();

  if (!sale) return null;

  const isDraft = sale.status === "DRAFT";
  const isCompleted = sale.status === "COMPLETED";
  const isCancelled = sale.status === "CANCELLED";

  async function handleComplete() {
    if (!sale) return;
    await completeMutation.mutateAsync(sale.id);
    onOpenChange(false);
  }

  async function handleCancel() {
    if (!sale) return;
    if (
      !confirm(
        "Êtes-vous sûr de vouloir annuler cette vente ? Le stock décrémenté sera réintégré."
      )
    ) {
      return;
    }
    await cancelMutation.mutateAsync(sale.id);
    onOpenChange(false);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 text-zinc-900 dark:text-zinc-100"
      >
        <SheetHeader className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <SheetTitle className="text-lg font-bold">
                {sale.reference}
              </SheetTitle>
            </div>
            <div>
              {isCompleted && (
                <Badge
                  variant="success"
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Validée
                </Badge>
              )}
              {isDraft && (
                <Badge
                  variant="warning"
                  className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                >
                  <Clock className="mr-1 h-3 w-3" />
                  Brouillon
                </Badge>
              )}
              {isCancelled && (
                <Badge
                  variant="destructive"
                  className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                >
                  <XCircle className="mr-1 h-3 w-3" />
                  Annulée
                </Badge>
              )}
            </div>
          </div>
          <SheetDescription className="text-xs text-zinc-500">
            Détail du bordereau de vente et traçabilité des articles.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/40 p-4 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <div>
                <span className="text-zinc-500">Date d&apos;émission :</span>
                <p className="font-medium text-zinc-800 dark:text-zinc-200">
                  {formatDate(sale.sale_date)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-zinc-400" />
              <div>
                <span className="text-zinc-500">Dépôt d&apos;expédition :</span>
                <p className="font-medium text-zinc-800 dark:text-zinc-200">
                  {sale.warehouse_name || "Dépôt Principal"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 col-span-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
              <User className="h-4 w-4 text-zinc-400" />
              <div>
                <span className="text-zinc-500">Client :</span>
                <p className="font-medium text-zinc-800 dark:text-zinc-200">
                  {sale.customer_name || "Client Comptoir / Vente directe"}
                </p>
              </div>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Articles commandés ({sale.items?.length || 0})
            </h4>

            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="grid grid-cols-12 bg-zinc-100 dark:bg-zinc-900/80 px-4 py-2 text-[11px] font-semibold text-zinc-500 uppercase">
                <span className="col-span-6">Désignation</span>
                <span className="col-span-2 text-center">Qté</span>
                <span className="col-span-2 text-right">P.U.</span>
                <span className="col-span-2 text-right">Total</span>
              </div>

              {sale.items?.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 items-center px-4 py-3 text-xs bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors"
                >
                  <div className="col-span-6 pr-2">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {item.product_name || "Produit standard"}
                    </p>
                  </div>
                  <div className="col-span-2 text-center tabular-nums text-zinc-700 dark:text-zinc-300 font-medium">
                    {item.quantity}
                  </div>
                  <div className="col-span-2 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                    {formatFCFA(item.unit_price)}
                  </div>
                  <div className="col-span-2 text-right tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatFCFA(item.total)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Totals */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-4">
            <div className="flex justify-between py-1 text-xs text-zinc-500">
              <span>Sous-total HT</span>
              <span className="tabular-nums font-medium text-zinc-700 dark:text-zinc-300">
                {formatFCFA(sale.subtotal)}
              </span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between py-1 text-xs text-emerald-600 dark:text-emerald-400">
                <span>Remise commerciale</span>
                <span className="tabular-nums font-medium">
                  -{formatFCFA(sale.discount)}
                </span>
              </div>
            )}
            <div className="mt-2 flex items-baseline justify-between border-t border-zinc-200 dark:border-zinc-800 pt-3">
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                Total Net TTC
              </span>
              <span className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 tabular-nums">
                {formatFCFA(sale.total)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimer reçu
            </button>

            <div className="flex items-center gap-2">
              {isDraft && (
                <button
                  type="button"
                  disabled={completeMutation.isPending}
                  onClick={handleComplete}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all disabled:opacity-50"
                >
                  {completeMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Valider la vente
                </button>
              )}

              {isCompleted && canCancelSale && (
                <button
                  type="button"
                  disabled={cancelMutation.isPending}
                  onClick={handleCancel}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors disabled:opacity-50"
                >
                  {cancelMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  Annuler la vente
                </button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
