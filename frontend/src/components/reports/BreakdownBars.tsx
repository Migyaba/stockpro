import { formatFCFA } from "@/lib/utils/format";

/** Répartition en barres horizontales (magnitude, une seule teinte), valeur au bout. */
export function BreakdownBars({
  rows,
  emptyLabel,
}: {
  rows: { key: string; label: string; value: number; detail?: string }[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-xs text-zinc-500">{emptyLabel}</p>;
  }
  const max = Math.max(...rows.map((r) => r.value), 1);
  const total = rows.reduce((acc, r) => acc + r.value, 0) || 1;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.key} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">{r.label}</span>
            <span className="shrink-0 tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatFCFA(r.value)}{" "}
              <span className="text-zinc-400">({Math.round((r.value / total) * 100)} %)</span>
            </span>
          </div>
          <div className="h-2 rounded-[4px] bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-2 rounded-[4px] bg-indigo-600 dark:bg-indigo-500"
              style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }}
            />
          </div>
          {r.detail && <p className="text-[11px] text-zinc-400">{r.detail}</p>}
        </li>
      ))}
    </ul>
  );
}
