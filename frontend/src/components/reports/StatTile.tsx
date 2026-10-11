import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils/format";

/**
 * Indicateur : libellé, valeur, évolution signée vs période précédente.
 * La couleur du delta suit direction × « la hausse est-elle bonne », et
 * l'icône + le texte portent l'information (jamais la couleur seule).
 */
export function StatTile({
  label,
  value,
  delta,
  deltaLabel = "vs période préc.",
  upIsGood = true,
  hint,
}: {
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  upIsGood?: boolean;
  hint?: string;
}) {
  const hasDelta = delta !== undefined && delta !== null;
  const good = hasDelta && (delta === 0 ? null : (delta > 0) === upIsGood);
  const Icon = !hasDelta || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">{value}</p>
      {hasDelta ? (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-xs",
            good === null
              ? "text-zinc-500"
              : good
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-rose-700 dark:text-rose-400"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {delta > 0 ? "+" : ""}
          {delta.toLocaleString("fr-FR")} % <span className="text-zinc-400">{deltaLabel}</span>
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>
      )}
    </div>
  );
}
