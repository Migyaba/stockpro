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
  Boxes,
  Loader2,
  Sparkles,
  AlertCircle,
  Building2,
  TrendingUp,
} from "lucide-react";
import { formatFCFA } from "@/lib/utils/format";
import { useAuthStore } from "@/lib/stores/authStore";
import { useCategories, useCreateProduct } from "@/lib/hooks/useProducts";
import type { ProductCreatePayload } from "@/lib/types/api";

interface NewProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UNITS = [
  { value: "piece", label: "Pièce(s)" },
  { value: "carton", label: "Carton(s)" },
  { value: "sac", label: "Sac(s)" },
  { value: "kg", label: "Kilogramme (kg)" },
  { value: "litre", label: "Litre (L)" },
  { value: "paquet", label: "Paquet(s)" },
  { value: "bouteille", label: "Bouteille(s)" },
];

export function NewProductSheet({ open, onOpenChange }: NewProductSheetProps) {
  const { warehouses, activeWarehouse } = useAuthStore();
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [unit, setUnit] = useState("piece");
  const [description, setDescription] = useState("");
  const [purchasePrice, setPurchasePrice] = useState<number | "">("");
  const [sellingPrice, setSellingPrice] = useState<number | "">("");
  const [minimumStock, setMinimumStock] = useState<number>(5);
  const [maximumStock, setMaximumStock] = useState<number>(100);

  // Initial stock toggle
  const [hasInitialStock, setHasInitialStock] = useState(false);
  const [initialQuantity, setInitialQuantity] = useState<number>(10);
  const [initialWarehouse, setInitialWarehouse] = useState<string>(
    activeWarehouse?.id ?? warehouses[0]?.id ?? ""
  );

  const [errorMsg, setErrorMsg] = useState("");

  // Auto-generate SKU
  function generateSku() {
    const cleanName = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 4);
    const prefix = cleanName || "ART";
    const random = Math.floor(1000 + Math.random() * 9000);
    setSku(`${prefix}-${random}`);
  }

  // Margin calculation
  const pPrice = typeof purchasePrice === "number" ? purchasePrice : 0;
  const sPrice = typeof sellingPrice === "number" ? sellingPrice : 0;
  const margin = sPrice - pPrice;
  const marginPct = sPrice > 0 ? ((margin / sPrice) * 100).toFixed(1) : "0";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Le nom du produit est requis.");
      return;
    }
    if (!sku.trim()) {
      setErrorMsg("Le SKU (code référence) est requis.");
      return;
    }
    if (typeof sellingPrice !== "number" || sellingPrice < 0) {
      setErrorMsg("Le prix de vente doit être supérieur ou égal à 0 FCFA.");
      return;
    }
    if (hasInitialStock && (!initialWarehouse || initialQuantity < 0)) {
      setErrorMsg("Veuillez sélectionner un dépôt valide pour le stock initial.");
      return;
    }

    const payload: ProductCreatePayload = {
      name: name.trim(),
      category: categoryId || null,
      sku: sku.trim().toUpperCase(),
      barcode: barcode.trim() || undefined,
      description: description.trim() || undefined,
      unit: unit,
      purchase_price: typeof purchasePrice === "number" ? purchasePrice : 0,
      selling_price: sellingPrice,
      minimum_stock: minimumStock,
      maximum_stock: maximumStock,
      is_active: true,
      ...(hasInitialStock
        ? {
            initial_quantity: initialQuantity,
            initial_warehouse: initialWarehouse,
          }
        : {}),
    };

    try {
      await createProduct.mutateAsync(payload);
      // Reset form
      setName("");
      setCategoryId("");
      setSku("");
      setBarcode("");
      setDescription("");
      setPurchasePrice("");
      setSellingPrice("");
      setHasInitialStock(false);
      onOpenChange(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setErrorMsg(
        errorObj.response?.data?.detail ??
          "Une erreur est survenue lors de la création du produit."
      );
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl border-zinc-800 bg-zinc-950 p-0 text-zinc-100 flex flex-col"
      >
        <SheetHeader className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-lg font-semibold text-white">
                Nouveau produit
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-400">
                Ajoutez une référence au catalogue avec prix et stock initial
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

          {/* Section 1: Informations générales */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              1. Informations générales
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Nom du produit <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Riz Parfumé 25kg Papillon"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Catégorie
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">(Sans catégorie)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Unité de mesure
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  {UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">
                    SKU (Référence) <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateSku}
                    className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    <Sparkles className="h-3 w-3" /> Générer
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ex: RIZ-PARF-25"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="w-full font-mono uppercase rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Code-barres (EAN)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 604200000101"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full font-mono rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Description (facultative)
              </label>
              <textarea
                rows={2}
                placeholder="Spécifications, provenance, caractéristiques..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="h-px bg-zinc-800/80" />

          {/* Section 2: Tarification & Marge en FCFA */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
              <span>2. Tarification (FCFA)</span>
              {sPrice > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-normal normal-case text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  Marge: +{formatFCFA(margin)} ({marginPct}%)
                </span>
              )}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Prix d'achat unitaire
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={purchasePrice}
                    onChange={(e) =>
                      setPurchasePrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 pl-3.5 pr-14 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs font-medium text-zinc-500">
                    FCFA
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Prix de vente unitaire <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="0"
                    value={sellingPrice}
                    onChange={(e) =>
                      setSellingPrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 pl-3.5 pr-14 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs font-medium text-zinc-500">
                    FCFA
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-zinc-800/80" />

          {/* Section 3: Seuils & Stock Initial */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              3. Gestion de stock & Alertes
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Seuil d'alerte (Min)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Stock maximum (Capacité)
                </label>
                <input
                  type="number"
                  min="0"
                  value={maximumStock}
                  onChange={(e) => setMaximumStock(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Toggle stock initial */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-white">
                    Initialiser le stock dès maintenant
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Génère une position d'entrée avec mouvement de stock immuable
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={hasInitialStock}
                  onChange={(e) => setHasInitialStock(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              {hasInitialStock && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/60">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-300">
                      Quantité initiale
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={initialQuantity}
                      onChange={(e) => setInitialQuantity(Number(e.target.value))}
                      className="w-full rounded-lg border border-zinc-750 bg-zinc-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-300">
                      Dépôt cible
                    </label>
                    <div className="relative">
                      <select
                        value={initialWarehouse}
                        onChange={(e) => setInitialWarehouse(e.target.value)}
                        className="w-full rounded-lg border border-zinc-750 bg-zinc-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      >
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} ({w.city})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
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
              disabled={createProduct.isPending}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {createProduct.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Création…
                </>
              ) : (
                "Créer le produit"
              )}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
