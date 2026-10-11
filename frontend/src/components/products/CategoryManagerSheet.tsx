"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, Plus, Tags, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getApiErrorMessage } from "@/lib/api/client";
import { toast } from "@/lib/stores/toastStore";
import { cn } from "@/lib/utils/format";
import { useAllCategories, useCreateCategory, useUpdateCategory } from "@/lib/hooks/useProducts";
import type { Category } from "@/lib/types/api";

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800";

// Catégories plates (§5.3) : création, renommage, désactivation/réactivation.
export function CategoryManagerSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: categories = [], isLoading } = useAllCategories(open);
  const create = useCreateCategory();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    try {
      await create.mutateAsync(newName.trim());
      setNewName("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de créer la catégorie."));
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white p-0 dark:bg-zinc-900">
        <SheetHeader className="border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Tags className="h-5 w-5" />
            <SheetTitle className="text-lg font-bold">Catégories</SheetTitle>
          </div>
          <SheetDescription className="text-xs text-zinc-500">
            Une catégorie désactivée n&apos;est plus proposée, mais les produits existants la gardent.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 p-6">
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nouvelle catégorie (ex. Boissons)"
              maxLength={120}
              className={INPUT_CLASS}
            />
            <button
              type="submit"
              disabled={create.isPending || !newName.trim()}
              aria-label="Ajouter la catégorie"
              className="flex shrink-0 items-center justify-center rounded-lg bg-indigo-600 px-3 text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </button>
          </form>
          {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          ) : categories.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucune catégorie pour l&apos;instant.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {categories.map((category) => (
                <CategoryRow key={category.id} category={category} />
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const update = useUpdateCategory();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);

  function save(payload: { name?: string; is_active?: boolean }, onDone?: () => void) {
    update.mutate(
      { id: category.id, payload },
      {
        onSuccess: onDone,
        onError: (err) => toast.apiError(err, "Impossible de modifier la catégorie."),
      }
    );
  }

  if (editing) {
    return (
      <li className="flex items-center gap-2 px-3 py-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          className={INPUT_CLASS}
        />
        <button
          type="button"
          aria-label="Enregistrer"
          disabled={!name.trim() || update.isPending}
          onClick={() => save({ name: name.trim() }, () => setEditing(false))}
          className="text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Annuler"
          onClick={() => {
            setName(category.name);
            setEditing(false);
          }}
          className="text-zinc-400 hover:text-zinc-700"
        >
          <X className="h-4 w-4" />
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm">
      <span
        className={cn(
          "truncate",
          category.is_active ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400 line-through"
        )}
      >
        {category.name}
      </span>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          aria-label={`Renommer ${category.name}`}
          onClick={() => setEditing(true)}
          className="text-zinc-400 hover:text-indigo-600"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={update.isPending}
          onClick={() => save({ is_active: !category.is_active })}
          className="text-[11px] text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          {category.is_active ? "Désactiver" : "Réactiver"}
        </button>
      </div>
    </li>
  );
}
