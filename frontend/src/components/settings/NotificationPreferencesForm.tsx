"use client";

import { Loader2, Mail } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api/client";
import { useNotificationPreferences, useUpdateNotificationPreferences } from "@/lib/hooks/useNotifications";
import { toast } from "@/lib/stores/toastStore";
import type { NotificationKind } from "@/lib/types/api";
import { cn } from "@/lib/utils/format";

// Emails reçus en plus de la cloche ; seuls les types accessibles au membre sont listés.
export function NotificationPreferencesForm() {
  const { data, isLoading } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  function toggle(kind: NotificationKind, email: boolean) {
    update.mutate(
      { [kind]: email },
      {
        onSuccess: () => toast.success(email ? "Email activé." : "Email désactivé."),
        onError: (err) => toast.error(getApiErrorMessage(err, "Impossible d'enregistrer ce choix.")),
      }
    );
  }

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Notifications par email</h3>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Toutes les notifications restent visibles dans la cloche. Choisissez celles que vous recevez aussi par email.
        </p>
      </div>

      {isLoading || !data ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        </div>
      ) : (
        <>
          {!data.email_verified && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
              Votre adresse email n&apos;est pas confirmée : aucun email ne vous sera envoyé.
            </p>
          )}
          {data.kinds.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Aucune notification ne concerne votre rôle.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.kinds.map((item) => {
                const pending = update.isPending && update.variables?.[item.kind] !== undefined;
                return (
                  <li key={item.kind} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{item.label}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.description}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.email}
                      aria-label={`Email : ${item.label}`}
                      disabled={update.isPending}
                      onClick={() => toggle(item.kind, !item.email)}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-wait dark:focus-visible:ring-offset-zinc-900",
                        item.email ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform",
                          item.email ? "translate-x-5" : "translate-x-0.5"
                        )}
                      >
                        {pending && <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
