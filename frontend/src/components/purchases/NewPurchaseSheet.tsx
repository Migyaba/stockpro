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
  Loader2,
  AlertCircle,
  Truck,
  Building2,
  Calendar,
  Users,
} from "lucide-react";
import { formatFCFA } from "@/lib/utils/format";
import { useAuthStore } from "@/lib/stores/authStore";
import { useSuppliers } from "@/lib/hooks/useSuppliers";
import { useProducts } from "@/lib/hooks/useProducts";
import { useCreatePurchase } from "@/lib/hooks/usePurchases";
import type { CreatePurchasePayload } from "@/lib/types/api";

interface NewPurchaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PurchaseLineForm {
  id: string;
  product: string;
  quantity: number;
  unit_price: number;
  discount: number;
}

export function NewPurchaseSheet({ open, onOpenChange }: NewPurchaseSheetProps) {
  const { warehouses, activeWarehouse } = useAuthStore();
  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();
  const createPurchase = useCreatePurchase();

  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState(
    activeWarehouse?.id ?? warehouses[0]?.id ?? ""
  );
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expectedDate, setExpectedDate] = useState("");

  const [lines, setLines] = useState<PurchaseLineForm[]>([
    {
      id: "pline-1",
      product: "",
      quantity: 10,
      unit_price: 0,
      discount: 0,
    },
  ]);

  const [errorMsg, setErrorMsg] = useState("");

  function handleProductChange(lineId: string, productId: string) {
    const prod = products.find((p) => p.id === productId);
    setLines((prev) =>
      prev.map((line) => {
        if (line.id === lineId) {
          return {
            ...line,
            product: productId,
            unit_price: prod?.purchase_price ?? 0,
          };
        }
        return line;
      })
    );
  }

  function handleQuantityChange(lineId: string, qty: number) {
    setLines((prev) =>
      prev.map((line) =>
        line.id === lineId ? { ...line, quantity: Math.max(1, qty) } : line
      )
    );
  }

  function handlePriceChange(lineId: string, price: number) {
    setLines((prev) =>
      prev.map((line) =>
        line.id === lineId ? { ...line, unit_price: Math.max(0, price) } : line
      )
    );
  }

  function handleDiscountChange(lineId: string, discount: number) {
    setLines((prev) =>
      prev.map((line) =>
        line.id === lineId ? { ...line, discount: Math.max(0, discount) } : line
      )
    );
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        id: `pline-${Date.now()}`,
        product: "",
        quantity: 10,
        unit_price: 0,
        discount: 0,
      },
    ]);
  }

  function removeLine(lineId: string) {
    if (lines.length === 1) return;
    setLines((prev) => prev.filter((line) => line.id !== lineId));
  }

  // Totals
  const subtotal = lines.reduce(
    (acc, l) => acc + l.quantity * l.unit_price,
    0
  );
  const totalDiscount = lines.reduce((acc, l) => acc + l.discount, 0);
  const grandTotal = Math.max(0, subtotal - totalDiscount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!supplierId) {
      setErrorMsg("Veuillez sélectionner un fournisseur.");
      return;
    }
    if (!warehouseId) {
      setErrorMsg("Veuillez sélectionner un dépôt de réception.");
      return;
    }

    const invalidLine = lines.find((l) => !l.product || l.quantity <= 0);
    if (invalidLine) {
      setErrorMsg("Toutes les lignes doivent avoir un produit et une quantité supérieure à 0.");
      return;
    }

    const payload: CreatePurchasePayload = {
      supplier: supplierId,
      warehouse: warehouseId,
      purchase_date: purchaseDate,
      expected_date: expectedDate || null,
      items: lines.map((l) => ({
        product: l.product,
        quantity: l.quantity,
        unit_price: l.unit_price,
        discount: l.discount > 0 ? l.discount : undefined,
      })),
    };

    try {
      await createPurchase.mutateAsync(payload);
      onOpenChange(false);
      // Reset form
      setLines([
        {
          id: `pline-${Date.now()}`,
          product: "",
          quantity: 10,
          unit_price: 0,
          discount: 0,
        },
      ]);
      setExpectedDate("");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setErrorMsg(
        errorObj.response?.data?.detail ??
          "Une erreur est survenue lors de la création de la commande d'achat."
      );
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl border-zinc-800 bg-zinc-950 p-0 text-zinc-100 flex flex-col"
      >
        <SheetHeader className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-lg font-semibold text-white">
                Nouvelle commande d'achat
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-400">
                Créez un bon d'approvisionnement auprès d'un fournisseur
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-800/50 bg-rose-950/40 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* En-tête commande */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-zinc-400" />
                Fournisseur <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Sélectionner un fournisseur...</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} ({sup.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                Dépôt de réception <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                Date de commande
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                Date de livraison prévue
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="h-px bg-zinc-800/80" />

          {/* Lignes d'articles commandés */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Articles à approvisionner ({lines.length})
              </h3>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300"
              >
                <Plus className="h-3.5 w-3.5" /> Ajouter une ligne
              </button>
            </div>

            <div className="space-y-3">
              {lines.map((line, index) => {
                const lineTotal = line.quantity * line.unit_price - line.discount;
                return (
                  <div
                    key={line.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-400">
                        Ligne #{index + 1}
                      </span>
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          className="text-zinc-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-zinc-300">
                        Produit
                      </label>
                      <select
                        required
                        value={line.product}
                        onChange={(e) =>
                          handleProductChange(line.id, e.target.value)
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="">Sélectionner un article...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) — Achat : {formatFCFA(p.purchase_price)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-400">
                          Quantité
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={line.quantity}
                          onChange={(e) =>
                            handleQuantityChange(line.id, Number(e.target.value))
                          }
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-400">
                          P.U. Achat (FCFA)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          required
                          value={line.unit_price}
                          onChange={(e) =>
                            handlePriceChange(line.id, Number(e.target.value))
                          }
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-400">
                          Remise (FCFA)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={line.discount}
                          onChange={(e) =>
                            handleDiscountChange(line.id, Number(e.target.value))
                          }
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1 text-xs">
                      <span className="text-zinc-400">Sous-total ligne : </span>
                      <span className="ml-1.5 font-semibold text-white">
                        {formatFCFA(Math.max(0, lineTotal))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-zinc-800/80" />

          {/* Récapitulatif financier */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Sous-total brut</span>
              <span className="text-zinc-200 font-medium">
                {formatFCFA(subtotal)}
              </span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-xs text-emerald-400">
                <span>Remise fournisseur</span>
                <span>-{formatFCFA(totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-zinc-800">
              <span>Total Commande Achat</span>
              <span className="text-indigo-400 text-base">
                {formatFCFA(grandTotal)}
              </span>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3 sticky bottom-0 bg-zinc-950/90 backdrop-blur-md pb-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-900 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createPurchase.isPending}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {createPurchase.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                "Enregistrer en brouillon"
              )}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
