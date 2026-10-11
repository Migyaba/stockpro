"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/Pagination";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { INVENTORY_STATUS } from "@/components/inventory/status";
import { getApiErrorMessage } from "@/lib/api/client";
import { useCategories } from "@/lib/hooks/useProducts";
import { useCreateInventory, useInventories } from "@/lib/hooks/useInventories";
import { useAuthStore } from "@/lib/stores/authStore";
import { formatDatetime } from "@/lib/utils/format";

const PAGE_SIZE = 20;

export default function InventairesPage() {
  const canCreate = useAuthStore((s) => s.permissions.includes("inventory.create"));
  const [page, setPage] = useState(1);
  const [newOpen, setNewOpen] = useState(false);
  const { data, isLoading } = useInventories({ page, page_size: PAGE_SIZE });
  const inventories = data?.results ?? [];

  return (
    <div className="flex w-full flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Inventaires</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Comptez le stock réel d&apos;un dépôt : les écarts validés deviennent des ajustements tracés.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Nouvel inventaire
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
        {isLoading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : inventories.length === 0 ? (
          <p className="p-10 text-center text-sm text-zinc-500">Aucun inventaire pour l&apos;instant.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {inventories.map((inv) => {
              const status = INVENTORY_STATUS[inv.status];
              const progress = inv.stats.lines ? Math.round((inv.stats.counted / inv.stats.lines) * 100) : 0;
              return (
                <li key={inv.id}>
                  <Link
                    href={`/inventaires/${inv.id}`}
                    className="flex flex-col gap-2 p-4 hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-zinc-800/40"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {inv.reference}
                        </span>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">
                        {inv.warehouse_name}
                        {inv.category_name && <span className="text-zinc-400"> · {inv.category_name}</span>}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {inv.validated_at
                          ? `Validé le ${formatDatetime(inv.validated_at)} par ${inv.validated_by_name ?? "—"}`
                          : `Créé le ${formatDatetime(inv.created_at)}`}
                      </p>
                    </div>
                    <div className="text-xs text-zinc-500 sm:text-right">
                      {inv.stats.counted} / {inv.stats.lines} produits comptés ({progress} %)
                      {inv.stats.differences !== undefined && inv.stats.differences > 0 && (
                        <span className="block text-amber-700 dark:text-amber-400">
                          {inv.stats.differences} écart{inv.stats.differences > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.count ?? 0} onPageChange={setPage} />
      </div>

      <NewInventorySheet open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}

function NewInventorySheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-white p-0 dark:bg-zinc-900">
        {open && <NewInventoryForm onDone={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

function NewInventoryForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const { warehouses, activeWarehouse } = useAuthStore();
  const { data: categories = [] } = useCategories();
  const create = useCreateInventory();
  const [warehouse, setWarehouse] = useState(activeWarehouse?.id ?? warehouses[0]?.id ?? "");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const inventory = await create.mutateAsync({ warehouse, category: category || null, notes });
      onDone();
      router.push(`/inventaires/${inventory.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de démarrer l'inventaire."));
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800";

  return (
    <>
      <SheetHeader className="border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
        <SheetTitle className="text-lg font-bold">Nouvel inventaire</SheetTitle>
        <SheetDescription className="text-xs text-zinc-500">
          Le stock théorique est figé au démarrage. Idéalement, comptez boutique fermée : une vente
          pendant le comptage fausse l&apos;écart du produit concerné.
        </SheetDescription>
      </SheetHeader>
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        {error && (
          <p className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        )}
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Dépôt</span>
          <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className={fieldClass}>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Périmètre</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass}>
            <option value="">Tous les produits actifs</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                Catégorie : {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Note (optionnelle)</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={fieldClass} />
        </label>
        <button
          type="submit"
          disabled={create.isPending || !warehouse}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Démarrer le comptage
        </button>
      </form>
    </>
  );
}
