"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { useAuditLog } from "@/lib/hooks/useNotifications";
import { cn, formatDatetime } from "@/lib/utils/format";
import type { AuditEntry } from "@/lib/types/api";

const PAGE_SIZE = 30;

const ENTITY_LABELS: Record<string, string> = {
  Product: "Produit",
  Category: "Catégorie",
  Sale: "Vente",
  Purchase: "Achat",
  Transfer: "Transfert",
  InventoryCount: "Inventaire",
  Membership: "Membre",
  Invitation: "Invitation",
  Organization: "Paramètres",
  Warehouse: "Dépôt",
  Customer: "Client",
  Supplier: "Fournisseur",
  User: "Compte",
};

const FIELD_LABELS: Record<string, string> = {
  name: "Nom",
  sku: "SKU",
  barcode: "Code-barres",
  selling_price: "Prix de vente",
  purchase_price: "Prix d'achat",
  minimum_stock: "Seuil minimum",
  maximum_stock: "Stock maximum",
  category: "Catégorie",
  unit: "Unité",
  is_active: "Actif",
  role: "Rôle",
  warehouse_ids: "Dépôts autorisés",
  tax_enabled: "TVA activée",
  tax_rate_bps: "Taux de TVA (points de base)",
  prices_include_tax: "Prix TTC",
  max_discount_percent_manager: "Remise max manager (%)",
  currency: "Devise",
  timezone: "Fuseau horaire",
  email: "Email",
  phone: "Téléphone",
  address: "Adresse",
  city: "Ville",
};

const ACTIONS = [
  { value: "", label: "Toutes les actions" },
  { value: "CREATE", label: "Créations" },
  { value: "UPDATE", label: "Modifications" },
  { value: "VALIDATE", label: "Validations" },
  { value: "CANCEL", label: "Annulations" },
  { value: "RECEIVE", label: "Réceptions" },
  { value: "DELETE", label: "Suppressions" },
  { value: "LOGIN", label: "Connexions" },
];

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "oui" : "non";
  if (Array.isArray(value)) return value.length ? `${value.length} élément(s)` : "tous";
  if (typeof value === "number") return value.toLocaleString("fr-FR");
  return String(value);
}

function Changes({ entry }: { entry: AuditEntry }) {
  const after = entry.new_values ?? {};
  const before = entry.old_values ?? {};
  const keys = Object.keys(after);
  if (keys.length === 0) return null;
  return (
    <ul className="mt-1 space-y-0.5 text-[11px] text-zinc-500">
      {keys.map((key) => (
        <li key={key}>
          {FIELD_LABELS[key] ?? key} :{" "}
          {key in before && (
            <>
              <span className="line-through">{display(before[key])}</span> →{" "}
            </>
          )}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{display(after[key])}</span>
        </li>
      ))}
    </ul>
  );
}

export function AuditLogSection() {
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useAuditLog({ action, search, page, page_size: PAGE_SIZE }, true);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Journal d&apos;audit</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Qui a fait quoi et quand. Les modifications indiquent l&apos;ancienne et la nouvelle valeur.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Référence, produit, utilisateur…"
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {ACTIONS.map((a) => (
            <option key={a.value || "all"} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-xs transition-opacity dark:border-zinc-800 dark:bg-zinc-900",
          isFetching && !isLoading && "opacity-70"
        )}
      >
        {isLoading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : (data?.results ?? []).length === 0 ? (
          <p className="p-10 text-center text-sm text-zinc-500">Aucune entrée.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {data!.results.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-1 px-4 py-3 text-xs sm:flex-row sm:gap-4">
                <span className="shrink-0 tabular-nums text-zinc-400 sm:w-36">{formatDatetime(entry.created_at)}</span>
                <div className="min-w-0">
                  <p className="text-zinc-700 dark:text-zinc-300">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{entry.user_name}</span>{" "}
                    {entry.action_label.toLowerCase()}{" "}
                    <span className="text-zinc-500">{ENTITY_LABELS[entry.entity_type] ?? entry.entity_type}</span>{" "}
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">« {entry.entity_label} »</span>
                  </p>
                  <Changes entry={entry} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.count ?? 0} onPageChange={setPage} />
      </div>
    </div>
  );
}
