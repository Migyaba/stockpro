"use client";

import { useState } from "react";
import { Loader2, UserCog } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getApiErrorMessage } from "@/lib/api/client";
import { usePermissionCatalog, useUpdateMember } from "@/lib/hooks/useOrganization";
import { PERMISSION_GROUPS } from "@/lib/permissions";
import { useAuthStore } from "@/lib/stores/authStore";
import { toast } from "@/lib/stores/toastStore";
import type { OrganizationMember, Role, Warehouse } from "@/lib/types/api";

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Propriétaire",
  ADMINISTRATOR: "Administrateur",
  MANAGER: "Gestionnaire",
  STAFF: "Caissier / Opérateur",
};

interface EditMemberSheetProps {
  member: OrganizationMember | null;
  warehouses: Warehouse[];
  onOpenChange: (open: boolean) => void;
}

export function EditMemberSheet({ member, warehouses, onOpenChange }: EditMemberSheetProps) {
  return (
    <Sheet open={!!member} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white dark:bg-zinc-900 p-0 border-l border-zinc-200 dark:border-zinc-800">
        {/* La clé réinitialise le formulaire à chaque membre ouvert. */}
        {member && (
          <EditMemberForm
            key={member.id}
            member={member}
            warehouses={warehouses}
            onDone={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function EditMemberForm({
  member,
  warehouses,
  onDone,
}: {
  member: OrganizationMember;
  warehouses: Warehouse[];
  onDone: () => void;
}) {
  const currentRole = useAuthStore((s) => s.role);
  const update = useUpdateMember();
  const [role, setRole] = useState<Role>(member.role);
  const [warehouseIds, setWarehouseIds] = useState<string[]>(member.warehouse_ids ?? []);
  const [error, setError] = useState<string | null>(null);
  const { data: catalog } = usePermissionCatalog();
  // Permissions cochées = permissions effectives du membre (rôle + ajustements).
  const [effective, setEffective] = useState<string[] | null>(null);

  // Propriétaire et administrateurs ne se gèrent que par le propriétaire
  // (règle backend) : un administrateur ne propose que gestionnaire et caissier.
  const roles: Role[] =
    currentRole === "OWNER" ? ["OWNER", "ADMINISTRATOR", "MANAGER", "STAFF"] : ["MANAGER", "STAFF"];
  const seesAllWarehouses = role === "OWNER" || role === "ADMINISTRATOR";
  const customizable = !!catalog?.customizable_roles.includes(role);
  const rolePermissions = catalog?.roles[role] ?? [];
  // Tant que rien n'a été coché, on part des permissions du membre ; si le
  // rôle change, des permissions par défaut de ce rôle.
  const checked =
    effective ??
    (role === member.role
      ? member.permissions ?? rolePermissions
      : rolePermissions);

  function changeRole(next: Role) {
    setRole(next);
    setEffective(null);
  }

  function togglePermission(code: string) {
    setEffective((prev) => {
      const base = prev ?? checked;
      return base.includes(code) ? base.filter((c) => c !== code) : [...base, code];
    });
  }

  function toggleWarehouse(id: string) {
    setWarehouseIds((prev) => (prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await update.mutateAsync({
        id: member.id,
        payload: {
          role,
          warehouse_ids: seesAllWarehouses ? [] : warehouseIds,
          // Écart par rapport aux permissions du rôle : ajouts et retraits.
          granted_permissions: customizable ? checked.filter((c) => !rolePermissions.includes(c)) : [],
          revoked_permissions: customizable ? rolePermissions.filter((c) => !checked.includes(c)) : [],
        },
      });
      toast.success("Accès mis à jour.");
      onDone();
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de modifier ce membre."));
    }
  }

  return (
    <>
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
        <SheetHeader>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
            <UserCog className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Équipe & Accès</span>
          </div>
          <SheetTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {member.user.full_name || member.user.email}
          </SheetTitle>
          <SheetDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            {member.user.email}
          </SheetDescription>
        </SheetHeader>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {error && (
          <p className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
            {error}
          </p>
        )}

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Rôle</span>
          <select
            value={role}
            onChange={(e) => changeRole(e.target.value as Role)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Dépôts autorisés
          </p>
          {seesAllWarehouses ? (
            <p className="text-[11px] text-zinc-500">
              Les propriétaires et administrateurs accèdent à tous les dépôts.
            </p>
          ) : (
            <>
              <p className="text-[11px] text-zinc-400 mb-2">
                Aucune case cochée = accès à tous les dépôts.
              </p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {warehouses.map((wh) => (
                  <label
                    key={wh.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={warehouseIds.includes(wh.id)}
                      onChange={() => toggleWarehouse(wh.id)}
                      className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{wh.name}</span>
                    <span className="text-[10px] text-zinc-400 font-mono ml-auto">{wh.code}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {customizable && catalog && (
          <div>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Permissions</p>
            <p className="text-[11px] text-zinc-400 mb-3">
              Cochées par défaut selon le rôle. Ajoutez ou retirez des droits pour ce membre seulement.
            </p>
            <div className="space-y-3">
              {PERMISSION_GROUPS.map((group) => {
                const items = group.permissions.filter((p) => catalog.grantable.includes(p.code));
                if (items.length === 0) return null;
                return (
                  <fieldset key={group.label}>
                    <legend className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      {group.label}
                    </legend>
                    <div className="grid grid-cols-1 gap-1">
                      {items.map((p) => {
                        const isChecked = checked.includes(p.code);
                        const fromRole = rolePermissions.includes(p.code);
                        const adjusted = isChecked !== fromRole;
                        return (
                          <label
                            key={p.code}
                            className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(p.code)}
                              className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-zinc-800 dark:text-zinc-200">{p.label}</span>
                            {adjusted && (
                              <span className="ml-auto rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                {isChecked ? "Ajoutée" : "Retirée"}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onDone}
            className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={update.isPending}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
          >
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer
          </button>
        </div>
      </form>
    </>
  );
}
