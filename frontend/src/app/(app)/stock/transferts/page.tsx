"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowRightLeft, Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/Pagination";
import { NewTransferSheet } from "@/components/transfers/NewTransferSheet";
import { useAuthStore } from "@/lib/stores/authStore";
import { toast } from "@/lib/stores/toastStore";
import { cn, formatDatetime } from "@/lib/utils/format";
import { useCancelTransfer, useCompleteTransfer, useTransfers } from "@/lib/hooks/useTransfers";
import type { Transfer, TransferStatus } from "@/lib/types/api";

const PAGE_SIZE = 20;

const STATUS: Record<TransferStatus, { label: string; variant: "warning" | "success" | "secondary" }> = {
  DRAFT: { label: "Brouillon", variant: "warning" },
  COMPLETED: { label: "Effectué", variant: "success" },
  CANCELLED: { label: "Annulé", variant: "secondary" },
};

const FILTERS: { value: TransferStatus | ""; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "DRAFT", label: "Brouillons" },
  { value: "COMPLETED", label: "Effectués" },
  { value: "CANCELLED", label: "Annulés" },
];

export default function TransfertsPage() {
  const canTransfer = useAuthStore((s) => s.permissions.includes("stock.transfer"));
  const multiWarehouse = useAuthStore((s) => s.warehouses.length > 1);
  const [status, setStatus] = useState<TransferStatus | "">("");
  const [page, setPage] = useState(1);
  const [newOpen, setNewOpen] = useState(false);
  const { data, isLoading } = useTransfers({ status, page, page_size: PAGE_SIZE });
  const transfers = data?.results ?? [];

  return (
    <div className="flex w-full flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/stock"
            className="mb-2 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Stock
          </Link>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Transferts entre dépôts
            </h1>
          </div>
        </div>
        {canTransfer && (
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            disabled={!multiWarehouse}
            title={multiWarehouse ? undefined : "Créez d'abord un second dépôt dans les paramètres."}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Nouveau transfert
          </button>
        )}
      </div>

      {!multiWarehouse && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          Les transferts nécessitent au moins deux dépôts. Ajoutez-en un depuis Paramètres → Dépôts.
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            type="button"
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              status === f.value
                ? "bg-indigo-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
        {isLoading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : transfers.length === 0 ? (
          <p className="p-10 text-center text-sm text-zinc-500">Aucun transfert.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {transfers.map((t) => (
              <TransferRow key={t.id} transfer={t} canTransfer={canTransfer} />
            ))}
          </ul>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.count ?? 0} onPageChange={setPage} />
      </div>

      <NewTransferSheet open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}

function TransferRow({ transfer, canTransfer }: { transfer: Transfer; canTransfer: boolean }) {
  const complete = useCompleteTransfer();
  const cancel = useCancelTransfer();
  const status = STATUS[transfer.status];
  const busy = complete.isPending || cancel.isPending;

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            {transfer.reference}
          </span>
          <Badge variant={status.variant}>{status.label}</Badge>
          <span className="text-[11px] text-zinc-400">
            {formatDatetime(transfer.completed_at ?? transfer.created_at)}
          </span>
        </div>
        <p className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
          {transfer.source_name}
          <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
          {transfer.destination_name}
        </p>
        <p className="truncate text-xs text-zinc-500">
          {transfer.items.map((i) => `${i.quantity} × ${i.product_name}`).join(" · ")}
        </p>
      </div>

      {canTransfer && transfer.status === "DRAFT" && (
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (!confirm(`Annuler le brouillon ${transfer.reference} ?`)) return;
              cancel.mutate(transfer.id, {
                onSuccess: () => toast.success("Transfert annulé."),
                onError: (err) => toast.apiError(err, "Impossible d'annuler le transfert."),
              });
            }}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              complete.mutate(transfer.id, {
                onSuccess: () => toast.success(`Transfert ${transfer.reference} effectué.`),
                onError: (err) => toast.apiError(err, "Impossible de valider le transfert."),
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {complete.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Valider
          </button>
        </div>
      )}
    </li>
  );
}
