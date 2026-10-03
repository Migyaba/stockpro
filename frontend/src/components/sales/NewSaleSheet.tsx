"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Building2,
  User,
  ShoppingBag,
} from "lucide-react";
import { formatFCFA, cn } from "@/lib/utils/format";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  useCustomers,
  useSaleProducts,
  useCreateSale,
  useCompleteSale,
} from "@/lib/hooks/useSales";
import type { CreateSaleItemPayload } from "@/lib/types/api";

interface NewSaleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormItem {
  id: string;
  product: string;
  quantity: number;
  unit_price: number;
  discount: number;
}

export function NewSaleSheet({ open, onOpenChange }: NewSaleSheetProps) {
  const { activeWarehouse, warehouses } = useAuthStore();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useSaleProducts();

  const createSale = useCreateSale();
  const completeSale = useCompleteSale();

  const [warehouseId, setWarehouseId] = useState<string>(
    activeWarehouse?.id ?? warehouses[0]?.id ?? "wh-dakar-01"
  );
  const [customerId, setCustomerId] = useState<string>("");
  const [items, setItems] = useState<FormItem[]>([
    {
      id: "line-1",
      product: "",
      quantity: 1,
      unit_price: 0,
      discount: 0,
    },
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Line item helpers
  function handleAddLine() {
    setItems((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}`,
        product: "",
        quantity: 1,
        unit_price: 0,
        discount: 0,
      },
    ]);
  }

  function handleRemoveLine(id: string) {
    if (items.length === 1) {
      setItems([{ id: "line-1", product: "", quantity: 1, unit_price: 0, discount: 0 }]);
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleProductChange(lineId: string, productId: string) {
    const selectedProd = products.find((p) => p.id === productId);
    setItems((prev) =>
      prev.map((item) =>
        item.id === lineId
          ? {
              ...item,
              product: productId,
              unit_price: selectedProd?.selling_price ?? 0,
            }
          : item
      )
    );
  }

  function handleUpdateLine(
    lineId: string,
    field: keyof FormItem,
    value: number
  ) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === lineId ? { ...item, [field]: value } : item
      )
    );
  }

  // Calculated values
  const subtotal = items.reduce(
    (acc, item) => acc + (item.quantity || 0) * (item.unit_price || 0),
    0
  );
  const totalDiscount = items.reduce(
    (acc, item) => acc + (item.discount || 0),
    0
  );
  const grandTotal = Math.max(0, subtotal - totalDiscount);

  async function handleSubmit(validateImmediately: boolean) {
    setErrorMsg(null);
    const validItems = items.filter((i) => i.product && i.quantity > 0);

    if (validItems.length === 0) {
      setErrorMsg("Veuillez sélectionner au moins un article avec une quantité supérieure à 0.");
      return;
    }

    const payloadItems: CreateSaleItemPayload[] = validItems.map((i) => ({
      product: i.product,
      quantity: Number(i.quantity),
      unit_price: Number(i.unit_price),
      discount: Number(i.discount || 0),
      tax: 0,
    }));

    try {
      const newSale = await createSale.mutateAsync({
        warehouse: warehouseId,
        customer: customerId || null,
        items: payloadItems,
      });

      if (validateImmediately && newSale?.id) {
        await completeSale.mutateAsync(newSale.id);
      }

      onOpenChange(false);
      // Reset form
      setItems([{ id: "line-1", product: "", quantity: 1, unit_price: 0, discount: 0 }]);
      setCustomerId("");
    } catch {
      setErrorMsg("Une erreur est survenue lors de l'enregistrement de la vente.");
    }
  }

  const isPending = createSale.isPending || completeSale.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 text-zinc-900 dark:text-zinc-100"
      >
        <SheetHeader className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-5">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <ShoppingBag className="h-5 w-5" />
            <SheetTitle className="text-lg font-bold">Nouvelle vente</SheetTitle>
          </div>
          <SheetDescription className="text-xs text-zinc-500">
            Enregistrez une vente au comptoir ou client régulier. Déstockage automatique lors de la validation.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-6">
          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-300 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-3 text-sm text-rose-700 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Dépôt & Client Section */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                Dépôt d&apos;expédition *
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                {warehouses.length > 0 ? (
                  warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))
                ) : (
                  <option value="wh-dakar-01">Entrepôt Principal Dakar</option>
                )}
              </select>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <User className="h-3.5 w-3.5 text-zinc-400" />
                Client
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Client Comptoir / Vente directe</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.city ? `(${c.city})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Articles Table */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Articles vendus ({items.length})
              </label>
              <button
                type="button"
                onClick={handleAddLine}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter une ligne
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {items.map((item, index) => {
                const lineTotal =
                  Math.max(0, (item.quantity || 0) * (item.unit_price || 0) - (item.discount || 0));

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/50 p-3 sm:flex-row sm:items-center"
                  >
                    {/* Product select */}
                    <div className="flex-1">
                      <select
                        value={item.product}
                        onChange={(e) => handleProductChange(item.id, e.target.value)}
                        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="">Sélectionner un produit...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {formatFCFA(p.selling_price)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qté"
                        value={item.quantity || ""}
                        onChange={(e) =>
                          handleUpdateLine(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 0))
                        }
                        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-1.5 text-center text-xs tabular-nums focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="w-28">
                      <input
                        type="number"
                        min="0"
                        placeholder="Prix unitaire"
                        value={item.unit_price || ""}
                        onChange={(e) =>
                          handleUpdateLine(item.id, "unit_price", Math.max(0, parseInt(e.target.value) || 0))
                        }
                        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-1.5 text-right text-xs tabular-nums focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Line Total */}
                    <div className="w-28 text-right font-medium text-xs tabular-nums text-zinc-900 dark:text-zinc-100">
                      {formatFCFA(lineTotal)}
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(item.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors"
                      title="Supprimer la ligne"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-4">
            <div className="flex justify-between py-1 text-xs text-zinc-500">
              <span>Sous-total HT</span>
              <span className="tabular-nums font-medium text-zinc-700 dark:text-zinc-300">
                {formatFCFA(subtotal)}
              </span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between py-1 text-xs text-emerald-600 dark:text-emerald-400">
                <span>Remise appliquée</span>
                <span className="tabular-nums font-medium">-{formatFCFA(totalDiscount)}</span>
              </div>
            )}
            <div className="mt-2 flex items-baseline justify-between border-t border-zinc-200 dark:border-zinc-800 pt-3">
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                Total Net TTC
              </span>
              <span className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 tabular-nums">
                {formatFCFA(grandTotal)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSubmit(false)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              Enregistrer brouillon
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSubmit(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition-all disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Valider et encaisser
                </>
              )}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
