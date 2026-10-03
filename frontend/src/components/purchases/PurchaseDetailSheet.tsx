"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Users,
  PackageCheck,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { formatFCFA, formatDate, cn } from "@/lib/utils/format";
import {
  useConfirmPurchase,
  useReceivePurchase,
  useCancelPurchase,
} from "@/lib/hooks/usePurchases";
import type { Purchase, PurchaseStatus } from "@/lib/types/api";

interface PurchaseDetailSheetProps {
  purchase: Purchase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_CONFIG: Record<
  PurchaseStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; badgeVariant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: {
    label: "Brouillon",
    icon: Clock,
    color: "text-amber-400 bg-amber-950/40 border-amber-800/60",
    badgeVariant: "outline",
  },
  CONFIRMED: {
    label: "Confirmée / En attente",
    icon: Truck,
    color: "text-sky-400 bg-sky-950/40 border-sky-800/60",
    badgeVariant: "secondary",
  },
  PARTIALLY_RECEIVED: {
    label: "Partiellement reçue",
    icon: PackageCheck,
    color: "text-indigo-400 bg-indigo-950/40 border-indigo-800/60",
    badgeVariant: "secondary",
  },
  RECEIVED: {
    label: "Entièrement reçue",
    icon: CheckCircle2,
    color: "text-emerald-400 bg-emerald-950/40 border-emerald-800/60",
    badgeVariant: "default",
  },
  CANCELLED: {
    label: "Annulée",
    icon: XCircle,
    color: "text-rose-400 bg-rose-950/40 border-rose-800/60",
    badgeVariant: "destructive",
  },
};

export function PurchaseDetailSheet({
  purchase,
  open,
  onOpenChange,
}: PurchaseDetailSheetProps) {
  const confirmPurchase = useConfirmPurchase();
  const receivePurchase = useReceivePurchase();
  const cancelPurchase = useCancelPurchase();

  const [receivingMode, setReceivingMode] = useState(false);
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({});
  const [actionError, setActionError] = useState("");

  if (!purchase) return null;

  const statusCfg = STATUS_CONFIG[purchase.status] ?? STATUS_CONFIG.DRAFT;
  const StatusIcon = statusCfg.icon;

  function initReceivingMode() {
    if (!purchase) return;
    const initialQtys: Record<string, number> = {};
    purchase.items.forEach((item) => {
      const remaining = Math.max(0, item.quantity - item.quantity_received);
      initialQtys[item.id] = remaining;
    });
    setReceiveQuantities(initialQtys);
    setReceivingMode(true);
    setActionError("");
  }

  async function handleConfirm() {
    if (!purchase) return;
    setActionError("");
    try {
      await confirmPurchase.mutateAsync(purchase.id);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setActionError(
        errorObj.response?.data?.detail ??
          "Impossible de confirmer la commande."
      );
    }
  }

  async function handleCancel() {
    if (!purchase) return;
    if (!confirm("Voulez-vous vraiment annuler cette commande d'achat ?")) return;
    setActionError("");
    try {
      await cancelPurchase.mutateAsync(purchase.id);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setActionError(
        errorObj.response?.data?.detail ?? "Impossible d'annuler la commande."
      );
    }
  }

  async function handleReceiveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!purchase) return;
    setActionError("");

    const lines = Object.entries(receiveQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([purchase_item_id, quantity]) => ({
        purchase_item_id,
        quantity,
      }));

    if (lines.length === 0) {
      setActionError("Veuillez saisir au moins une quantité à réceptionner.");
      return;
    }

    try {
      await receivePurchase.mutateAsync({
        id: purchase.id,
        payload: { lines },
      });
      setReceivingMode(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setActionError(
        errorObj.response?.data?.detail ??
          "Une erreur est survenue lors de la réception de la marchandise."
      );
    }
  }

  const canConfirm = purchase.status === "DRAFT";
  const canReceive =
    purchase.status === "CONFIRMED" || purchase.status === "PARTIALLY_RECEIVED";
  const canCancel =
    purchase.status === "DRAFT" ||
    (purchase.status === "CONFIRMED" &&
      purchase.items.every((it) => it.quantity_received === 0));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl border-zinc-800 bg-zinc-950 p-0 text-zinc-100 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-lg font-semibold text-white font-mono">
                  {purchase.reference}
                </SheetTitle>
                <SheetDescription className="text-xs text-zinc-400">
                  Bon d'achat créé le {formatDate(purchase.created_at)}
                </SheetDescription>
              </div>
            </div>

            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
                statusCfg.color
              )}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              <span>{statusCfg.label}</span>
            </div>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {actionError && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-800/50 bg-rose-950/40 p-3 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Informations Fournisseur & Dépôt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase text-zinc-500 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Fournisseur
              </span>
              <p className="text-sm font-semibold text-white">
                {purchase.supplier_name}
              </p>
              <p className="text-xs text-zinc-400">
                Date commande : {formatDate(purchase.purchase_date)}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase text-zinc-500 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Dépôt de destination
              </span>
              <p className="text-sm font-semibold text-white">
                {purchase.warehouse_name}
              </p>
              {purchase.expected_date && (
                <p className="text-xs text-zinc-400">
                  Date prévue : {formatDate(purchase.expected_date)}
                </p>
              )}
            </div>
          </div>

          {/* Mode Réception de marchandise */}
          {receivingMode ? (
            <form onSubmit={handleReceiveSubmit} className="space-y-4 rounded-xl border border-indigo-800/50 bg-indigo-950/20 p-4">
              <div className="flex items-center justify-between border-b border-indigo-800/40 pb-3">
                <div className="flex items-center gap-2 text-indigo-300">
                  <PackageCheck className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Réception des articles en stock
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReceivingMode(false)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Fermer
                </button>
              </div>

              <p className="text-xs text-zinc-400">
                Indiquez les quantités physiquement réceptionnées dans le dépôt <strong>{purchase.warehouse_name}</strong> :
              </p>

              <div className="space-y-3">
                {purchase.items.map((item) => {
                  const remaining = Math.max(0, item.quantity - item.quantity_received);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3"
                    >
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-white">
                          {item.product_name}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          Déjà reçu : {item.quantity_received} / {item.quantity} (Reste : {remaining})
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs text-zinc-400">Qté reçue :</label>
                        <input
                          type="number"
                          min="0"
                          max={remaining}
                          value={receiveQuantities[item.id] ?? 0}
                          onChange={(e) =>
                            setReceiveQuantities({
                              ...receiveQuantities,
                              [item.id]: Number(e.target.value),
                            })
                          }
                          className="w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReceivingMode(false)}
                  className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-900 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={receivePurchase.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-600/30 transition disabled:opacity-50"
                >
                  {receivePurchase.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Incrémentation du stock…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Valider la réception
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : null}

          {/* Lignes d'articles commandés */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Articles commandés ({purchase.items.length})
            </h3>

            <div className="divide-y divide-zinc-800/80 rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              {purchase.items.map((item) => {
                const pct = Math.min(
                  100,
                  Math.round((item.quantity_received / item.quantity) * 100)
                );
                return (
                  <div key={item.id} className="p-3.5 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {item.quantity} × {formatFCFA(item.unit_price)}
                          {item.discount > 0 && ` (remise: -${formatFCFA(item.discount)})`}
                        </p>
                      </div>
                      <span className="font-semibold text-white text-sm">
                        {formatFCFA(item.total)}
                      </span>
                    </div>

                    {/* Barre de progression réception */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-zinc-400">
                        <span>Réception</span>
                        <span className={cn(pct === 100 ? "text-emerald-400 font-semibold" : "text-zinc-300")}>
                          {item.quantity_received} / {item.quantity} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-indigo-500" : "bg-transparent"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Récapitulatif financier */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Sous-total HT</span>
              <span className="text-zinc-200 font-medium">
                {formatFCFA(purchase.subtotal)}
              </span>
            </div>
            {purchase.discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-400">
                <span>Remise fournisseur</span>
                <span>-{formatFCFA(purchase.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-zinc-800">
              <span>Total Commande Achat</span>
              <span className="text-indigo-400 text-base">
                {formatFCFA(purchase.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions de bas de page */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/90 flex items-center justify-between gap-3">
          <div>
            {canCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelPurchase.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-rose-800/60 bg-rose-950/30 px-3.5 py-2 text-xs font-medium text-rose-300 hover:bg-rose-900/50 transition"
              >
                <XCircle className="h-3.5 w-3.5" />
                Annuler la commande
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {canConfirm && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirmPurchase.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-sky-600/30 transition disabled:opacity-50"
              >
                {confirmPurchase.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Truck className="h-3.5 w-3.5" />
                )}
                Confirmer la commande
              </button>
            )}

            {canReceive && !receivingMode && (
              <button
                type="button"
                onClick={initReceivingMode}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-600/30 transition"
              >
                <PackageCheck className="h-3.5 w-3.5" />
                Réceptionner le stock
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
