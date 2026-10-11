"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, Download, Loader2, ScanBarcode, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/Pagination";
import { INVENTORY_STATUS } from "@/components/inventory/status";
import { getApiErrorMessage } from "@/lib/api/client";
import { downloadExport } from "@/lib/api/reports";
import {
  useInventory,
  useInventoryAction,
  useInventoryLines,
  useRecordCounts,
} from "@/lib/hooks/useInventories";
import { useAuthStore } from "@/lib/stores/authStore";
import { toast } from "@/lib/stores/toastStore";
import { cn, formatDatetime } from "@/lib/utils/format";
import type { InventoryLine } from "@/lib/types/api";
import type { LineFilters } from "@/lib/api/inventories";

const PAGE_SIZE = 50;
type LineState = NonNullable<LineFilters["state"]>;

export default function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { permissions } = useAuthStore();
  const canCount = permissions.includes("inventory.count");
  const canValidate = permissions.includes("inventory.validate");
  const canCreate = permissions.includes("inventory.create");
  const canExport = permissions.includes("reports.export");

  const [search, setSearch] = useState("");
  const [state, setState] = useState<LineState>("");
  const [page, setPage] = useState(1);
  const { data: inventory, isLoading } = useInventory(id);
  const { data: lines, isFetching } = useInventoryLines(id, {
    page,
    page_size: PAGE_SIZE,
    search,
    state,
  });
  const action = useInventoryAction(id);

  if (isLoading || !inventory) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  const status = INVENTORY_STATUS[inventory.status];
  const counting = inventory.status === "COUNTING";
  const review = inventory.status === "REVIEW";
  const open = counting || review || inventory.status === "DRAFT";
  const progress = inventory.stats.lines ? (inventory.stats.counted / inventory.stats.lines) * 100 : 0;

  function run(kind: "review" | "reopen" | "validate" | "cancel", success: string, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    action.mutate(kind, {
      onSuccess: () => toast.success(success),
      onError: (err) => toast.apiError(err, "Action impossible."),
    });
  }

  const STATES: { value: LineState; label: string; show: boolean }[] = [
    { value: "", label: "Tous", show: true },
    { value: "uncounted", label: `Non comptés (${inventory.stats.uncounted})`, show: true },
    { value: "counted", label: `Comptés (${inventory.stats.counted})`, show: true },
    { value: "difference", label: `Écarts (${inventory.stats.differences ?? 0})`, show: canValidate },
  ];

  return (
    <div className="flex w-full flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <Link
            href="/inventaires"
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Inventaires
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {inventory.reference}
            </h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-sm text-zinc-500">
            {inventory.warehouse_name}
            {inventory.category_name ? ` · ${inventory.category_name}` : " · tous les produits actifs"}
            {inventory.started_at && ` · démarré le ${formatDatetime(inventory.started_at)}`}
          </p>
          {inventory.validated_at && (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Validé le {formatDatetime(inventory.validated_at)} par {inventory.validated_by_name ?? "—"} : les
              écarts ont été appliqués au stock.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {counting && canCount && (
            <button
              type="button"
              disabled={action.isPending}
              onClick={() => run("review", "Comptage terminé, inventaire en revue.")}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Terminer le comptage
            </button>
          )}
          {review && canCount && (
            <button
              type="button"
              disabled={action.isPending}
              onClick={() => run("reopen", "Comptage rouvert.")}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Rouvrir le comptage
            </button>
          )}
          {review && canValidate && (
            <button
              type="button"
              disabled={action.isPending}
              onClick={() =>
                run(
                  "validate",
                  "Inventaire validé : stock ajusté.",
                  `Valider ${inventory.reference} ? ${inventory.stats.differences ?? 0} écart(s) seront appliqués au stock. ` +
                    `${inventory.stats.uncounted} produit(s) non compté(s) seront ignorés. Cette action est définitive.`
                )
              }
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {action.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Valider l&apos;inventaire
            </button>
          )}
          {open && canCreate && (
            <button
              type="button"
              disabled={action.isPending}
              onClick={() =>
                run("cancel", "Inventaire annulé.", "Annuler cet inventaire ? Les comptages seront abandonnés.")
              }
              className="rounded-lg px-3 py-2 text-sm text-zinc-500 underline hover:text-zinc-900 disabled:opacity-50 dark:hover:text-zinc-200"
            >
              Annuler l&apos;inventaire
            </button>
          )}
          {canExport && inventory.status !== "DRAFT" && (
            <button
              type="button"
              onClick={() =>
                downloadExport("inventory", { inventory: inventory.id }).catch((err) =>
                  toast.apiError(err, "Export impossible.")
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Download className="h-4 w-4" />
              Rapport CSV
            </button>
          )}
        </div>
      </div>

      {/* Progression : la piste est un pas plus clair de la même teinte. */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-zinc-500">
          <span>
            {inventory.stats.counted} / {inventory.stats.lines} produits comptés
          </span>
          <span className="tabular-nums">{Math.round(progress)} %</span>
        </div>
        <div
          className="h-2 rounded-full bg-indigo-100 dark:bg-indigo-950"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progression du comptage"
        >
          <div className="h-2 rounded-full bg-indigo-600 dark:bg-indigo-500" style={{ width: `${progress}%` }} />
        </div>
        {review && inventory.stats.uncounted > 0 && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {inventory.stats.uncounted} produit(s) non compté(s) : ils seront ignorés (aucun ajustement).
          </p>
        )}
      </div>

      {counting && canCount && <ScanBox inventoryId={inventory.id} />}

      {!canValidate && counting && (
        <p className="text-xs text-zinc-500">
          Comptage à l&apos;aveugle : saisissez ce que vous voyez en rayon, le stock attendu n&apos;est pas affiché.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un produit"
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {STATES.filter((s) => s.show).map((s) => (
            <button
              key={s.value || "all"}
              type="button"
              aria-pressed={state === s.value}
              onClick={() => {
                setState(s.value);
                setPage(1);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium",
                state === s.value
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-opacity dark:border-zinc-800 dark:bg-zinc-900/60",
          isFetching && "opacity-70"
        )}
      >
        {(lines?.results ?? []).length === 0 ? (
          <p className="p-10 text-center text-sm text-zinc-500">Aucun produit dans cette sélection.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {lines!.results.map((line) => (
              <LineRow
                // La clé change après un enregistrement : le champ reprend la valeur serveur.
                key={`${line.id}-${line.counted_quantity}`}
                inventoryId={inventory.id}
                line={line}
                editable={counting && canCount}
                showExpected={canValidate}
                review={review}
              />
            ))}
          </ul>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={lines?.count ?? 0} onPageChange={setPage} />
      </div>
    </div>
  );
}

// Douchette USB (code + Entrée) ou saisie : chaque scan ajoute 1 au produit.
function ScanBox({ inventoryId }: { inventoryId: string }) {
  const record = useRecordCounts(inventoryId);
  const [code, setCode] = useState("");
  const [last, setLast] = useState<{ ok: boolean; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = code.trim();
    if (!value) return;
    record.mutate([{ code: value, add: 1 }], {
      onSuccess: ([line]) =>
        setLast({ ok: true, text: `${line.product_name} : ${line.counted_quantity} compté(s)` }),
      onError: (err) => setLast({ ok: false, text: getApiErrorMessage(err, "Code inconnu.") }),
      onSettled: () => {
        setCode("");
        inputRef.current?.focus();
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-1.5">
      <div className="relative">
        <ScanBarcode className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
        <input
          ref={inputRef}
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Scanner un code-barres ou saisir un SKU puis Entrée (+1)"
          autoComplete="off"
          className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      {last && (
        <p
          className={cn(
            "flex items-center gap-1.5 text-xs",
            last.ok ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
          )}
          role="status"
        >
          {last.ok ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
          {last.text}
        </p>
      )}
    </form>
  );
}

function LineRow({
  inventoryId,
  line,
  editable,
  showExpected,
  review,
}: {
  inventoryId: string;
  line: InventoryLine;
  editable: boolean;
  showExpected: boolean;
  review: boolean;
}) {
  const record = useRecordCounts(inventoryId);
  const [value, setValue] = useState(line.counted_quantity === null ? "" : String(line.counted_quantity));

  function save() {
    const next = value.trim() === "" ? null : Number(value);
    if (next === line.counted_quantity) return;
    if (next !== null && (!Number.isInteger(next) || next < 0)) {
      toast.error("La quantité comptée doit être un entier positif.");
      return;
    }
    record.mutate([{ product: line.product, counted_quantity: next }], {
      onError: (err) => toast.apiError(err, "Comptage non enregistré."),
    });
  }

  const diff = line.difference;
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{line.product_name}</p>
        <p className="font-mono text-[11px] text-zinc-400">
          {line.product_sku}
          {line.product_barcode ? ` · ${line.product_barcode}` : ""}
        </p>
        {review && line.stock_changed && (
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            Stock modifié depuis le démarrage : vérifiez avant de valider.
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-4 text-sm">
        {showExpected && (
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-zinc-400">Théorique</p>
            <p className="tabular-nums text-zinc-600 dark:text-zinc-300">{line.expected_quantity}</p>
          </div>
        )}
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">Compté</p>
          {editable ? (
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              aria-label={`Quantité comptée pour ${line.product_name}`}
              placeholder="—"
              className="w-20 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-right tabular-nums focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
            />
          ) : (
            <p className="tabular-nums text-zinc-900 dark:text-zinc-100">{line.counted_quantity ?? "—"}</p>
          )}
        </div>
        {showExpected && (
          <div className="w-14 text-right">
            <p className="text-[10px] uppercase tracking-wider text-zinc-400">Écart</p>
            {/* Le signe porte l'information ; la couleur ne fait que la renforcer. */}
            <p
              className={cn(
                "font-semibold tabular-nums",
                diff === null || diff === undefined || diff === 0
                  ? "text-zinc-400"
                  : diff > 0
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-rose-700 dark:text-rose-400"
              )}
            >
              {diff === null || diff === undefined ? "—" : diff > 0 ? `+${diff}` : diff}
            </p>
          </div>
        )}
        {record.isPending && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
      </div>
    </li>
  );
}
