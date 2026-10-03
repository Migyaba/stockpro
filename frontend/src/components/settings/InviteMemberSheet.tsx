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
  UserPlus,
  Mail,
  Shield,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { useInviteMember } from "@/lib/hooks/useOrganization";
import { useWarehouses } from "@/lib/hooks/useWarehouses";
import type { InviteMemberPayload, Role } from "@/lib/types/api";

interface InviteMemberSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const ROLES: Array<{
  value: Role;
  label: string;
  description: string;
}> = [
  {
    value: "ADMINISTRATOR",
    label: "Administrateur",
    description: "Accès complet à tous les modules, finances et paramètres.",
  },
  {
    value: "MANAGER",
    label: "Gestionnaire",
    description: "Peut gérer les stocks, valider les ventes et bons d'achat.",
  },
  {
    value: "STAFF",
    label: "Caissier / Opérateur",
    description: "Peut uniquement encaisser des ventes sur les dépôts autorisés.",
  },
];

export function InviteMemberSheet({
  open,
  onOpenChange,
  onSuccess,
}: InviteMemberSheetProps) {
  const inviteMember = useInviteMember();
  const { data: warehouses = [] } = useWarehouses();

  const [formData, setFormData] = useState<InviteMemberPayload>({
    email: "",
    role: "STAFF",
    warehouse_ids: [],
  });
  const [error, setError] = useState<string | null>(null);

  const toggleWarehouse = (id: string) => {
    setFormData((prev) => {
      const current = prev.warehouse_ids || [];
      const next = current.includes(id)
        ? current.filter((wId) => wId !== id)
        : [...current, id];
      return { ...prev, warehouse_ids: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      setError("L'adresse email du collaborateur est obligatoire.");
      return;
    }

    setError(null);
    try {
      await inviteMember.mutateAsync(formData);
      setFormData({
        email: "",
        role: "STAFF",
        warehouse_ids: [],
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'envoi de l'invitation."
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white dark:bg-zinc-900 p-0 border-l border-zinc-200 dark:border-zinc-800">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <SheetHeader>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
              <UserPlus className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Équipe & Accès
              </span>
            </div>
            <SheetTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Inviter un Collaborateur
            </SheetTitle>
            <SheetDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Donnez accès à vos caissiers, gestionnaires de stock ou associés.
            </SheetDescription>
          </SheetHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Adresse Email professionnelle <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="collaborateur@entreprise.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Rôle */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Rôle et permissions d'accès <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              {ROLES.map((r) => {
                const selected = formData.role === r.value;
                return (
                  <div
                    key={r.value}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, role: r.value }))
                    }
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      selected
                        ? "border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/30"
                        : "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/50 dark:border-zinc-800 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                        selected
                          ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500"
                          : "border-zinc-300 dark:border-zinc-600"
                      }`}
                    >
                      {selected && <Check className="h-2.5 w-2.5" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {r.label}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {r.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dépôts autorisés */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Dépôts / Points de vente affectés
            </label>
            <p className="text-[11px] text-zinc-400 mb-2">
              Laissez vide pour autoriser l'accès à tous les dépôts.
            </p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {warehouses.map((wh) => {
                const checked = formData.warehouse_ids?.includes(wh.id);
                return (
                  <label
                    key={wh.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleWarehouse(wh.id)}
                      className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {wh.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono ml-auto">
                      {wh.code}
                    </span>
                  </label>
                );
              })}
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
              disabled={inviteMember.isPending}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {inviteMember.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Envoi...</span>
                </>
              ) : (
                <span>Envoyer l'invitation</span>
              )}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
