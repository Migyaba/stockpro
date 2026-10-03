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
  MapPin,
  UserCheck,
  Tag,
  Loader2,
  AlertCircle,
  Building2,
} from "lucide-react";
import { useCreateWarehouse } from "@/lib/hooks/useWarehouses";
import type { CreateWarehousePayload } from "@/lib/types/api";

interface NewWarehouseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function NewWarehouseSheet({
  open,
  onOpenChange,
  onSuccess,
}: NewWarehouseSheetProps) {
  const createWarehouse = useCreateWarehouse();

  const [formData, setFormData] = useState<CreateWarehousePayload>({
    name: "",
    code: "",
    city: "Cotonou",
    address: "",
    manager_name: "",
    is_active: true,
  });
  const [error, setError] = useState<string | null>(null);

  const generateCode = (name: string) => {
    const clean = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .substring(0, 4);
    const rand = Math.floor(10 + Math.random() * 90);
    return clean ? `DEP-${clean}${rand}` : `DEP-${rand}`;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      code: prev.code || generateCode(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Le nom du dépôt ou de la boutique est obligatoire.");
      return;
    }
    if (!formData.code.trim()) {
      setError("Le code court d'identification est obligatoire.");
      return;
    }

    setError(null);
    try {
      await createWarehouse.mutateAsync(formData);
      setFormData({
        name: "",
        code: "",
        city: "Cotonou",
        address: "",
        manager_name: "",
        is_active: true,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la création du dépôt."
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white dark:bg-zinc-900 p-0 border-l border-zinc-200 dark:border-zinc-800">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <SheetHeader>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
              <Boxes className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Multi-Dépôts
              </span>
            </div>
            <SheetTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Nouveau Dépôt / Magasin
            </SheetTitle>
            <SheetDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Créez un emplacement physique distinct (entrepôt central, magasin, showroom).
            </SheetDescription>
          </SheetHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nom du dépôt */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nom de l'emplacement <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                placeholder="Ex: Boutique Marché Dantokpa"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Code court */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Code court d'identification <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    code: generateCode(prev.name),
                  }))
                }
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Générer
              </button>
            </div>
            <div className="relative">
              <Tag className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="MAG-DANTOKPA"
                className="w-full pl-9 pr-3 py-2 text-sm font-mono uppercase rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Responsable de l'emplacement */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Responsable / Gestionnaire
            </label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={formData.manager_name || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    manager_name: e.target.value,
                  }))
                }
                placeholder="Ex: Alain Gbaguidi"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Ville & Adresse */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Ville
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={formData.city || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, city: e.target.value }))
                  }
                  placeholder="Cotonou"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Quartier / Marché
              </label>
              <input
                type="text"
                value={formData.address || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Hangar 4B"
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createWarehouse.isPending}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {createWarehouse.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Création...</span>
                </>
              ) : (
                <span>Créer l'emplacement</span>
              )}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
