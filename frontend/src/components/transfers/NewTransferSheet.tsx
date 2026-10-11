"use client";

import { useState } from "react";
import { ArrowRightLeft, Loader2, Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getApiErrorMessage } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/authStore";
import { toast } from "@/lib/stores/toastStore";
import {
  useCompleteTransfer,
  useCreateTransfer,
  useWarehouseStock,
} from "@/lib/hooks/useTransfers";

interface Line {
  key: number;
  product: string;
  quantity: number;
}

const SELECT_CLASS =
  "w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900";

export function NewTransferSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 text-zinc-900 dark:text-zinc-100"
      >
        {/* Démonté à la fermeture : le formulaire repart à zéro à chaque ouverture. */}
        {open && <NewTransferForm onDone={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

function NewTransferForm({ onDone }: { onDone: () => void }) {
  const { warehouses, activeWarehouse } = useAuthStore();
  const [source, setSource] = useState(activeWarehouse?.id ?? warehouses[0]?.id ?? "");
  const [destination, setDestination] = useState(
    warehouses.find((w) => w.id !== (activeWarehouse?.id ?? warehouses[0]?.id))?.id ?? ""
  );
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ key: 1, product: "", quantity: 1 }]);
  const [error, setError] = useState<string | null>(null);

  // Seuls les produits présents dans le dépôt source peuvent partir.
  const { data: sourceStock = [], isLoading: stockLoading } = useWarehouseStock(source);
  const available = sourceStock.filter((p) => p.quantity > 0 && p.product.is_active);
  const availableQty = new Map(sourceStock.map((p) => [p.product.id, p.quantity]));

  const create = useCreateTransfer();
  const complete = useCompleteTransfer();
  const pending = create.isPending || complete.isPending;

  function updateLine(key: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  async function submit(validateNow: boolean) {
    setError(null);
    const items = lines
      .filter((l) => l.product && l.quantity > 0)
      .map((l) => ({ product: l.product, quantity: l.quantity }));
    if (!source || !destination) {
      setError("Choisissez le dépôt source et le dépôt de destination.");
      return;
    }
    if (source === destination) {
      setError("Les dépôts source et destination doivent être différents.");
      return;
    }
    if (items.length === 0) {
      setError("Ajoutez au moins un produit avec une quantité.");
      return;
    }
    try {
      const transfer = await create.mutateAsync({ source, destination, notes, items });
      if (validateNow) {
        await complete.mutateAsync(transfer.id);
        toast.success(`Transfert ${transfer.reference} effectué.`);
      } else {
        toast.success(`Brouillon ${transfer.reference} enregistré.`);
      }
      onDone();
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible d'enregistrer le transfert."));
    }
  }

  return (
    <>
      <SheetHeader className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-5">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <ArrowRightLeft className="h-5 w-5" />
          <SheetTitle className="text-lg font-bold">Nouveau transfert</SheetTitle>
        </div>
        <SheetDescription className="text-xs text-zinc-500">
          Déplacez du stock d&apos;un dépôt à un autre. La validation sort la marchandise de la
          source et l&apos;entre dans la destination en une seule opération.
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-5 p-6">
        {error && (
          <p className="whitespace-pre-line rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Depuis</span>
            <select
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setLines([{ key: Date.now(), product: "", quantity: 1 }]);
              }}
              className={SELECT_CLASS}
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Vers</span>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">Choisir…</option>
              {warehouses
                .filter((w) => w.id !== source)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Produits</p>
          {stockLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          ) : available.length === 0 ? (
            <p className="text-xs text-zinc-500">Aucun produit en stock dans ce dépôt.</p>
          ) : (
            lines.map((line) => {
              const max = availableQty.get(line.product) ?? 0;
              return (
                <div key={line.key} className="flex items-start gap-2">
                  <select
                    value={line.product}
                    onChange={(e) => updateLine(line.key, { product: e.target.value })}
                    className={SELECT_CLASS}
                  >
                    <option value="">Choisir un produit…</option>
                    {available.map((p) => (
                      <option key={p.product.id} value={p.product.id}>
                        {p.product.name} — {p.quantity} dispo
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={max || undefined}
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) })}
                    aria-label="Quantité"
                    className="w-24 shrink-0 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setLines((prev) =>
                        prev.length === 1
                          ? [{ key: Date.now(), product: "", quantity: 1 }]
                          : prev.filter((l) => l.key !== line.key)
                      )
                    }
                    aria-label="Retirer la ligne"
                    className="mt-2 shrink-0 text-zinc-400 hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
          {available.length > 0 && (
            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, { key: Date.now(), product: "", quantity: 1 }])}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter un produit
            </button>
          )}
        </div>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Note (optionnelle)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={SELECT_CLASS}
          />
        </label>

        <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 pt-4 sm:flex-row sm:justify-end dark:border-zinc-800">
          <button
            type="button"
            disabled={pending}
            onClick={() => submit(false)}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Enregistrer en brouillon
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => submit(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Valider le transfert
          </button>
        </div>
      </div>
    </>
  );
}
