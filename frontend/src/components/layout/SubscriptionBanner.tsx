"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import { fetchSubscriptionStatus } from "@/lib/api/billing";

export function SubscriptionBanner() {
  const pathname = usePathname();

  const { data: sub } = useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: fetchSubscriptionStatus,
    staleTime: 60_000,
  });

  // Ne pas afficher si l'accès est actif ou si les données ne sont pas encore chargées
  if (!sub || sub.has_active_access) {
    return null;
  }

  // Si on est déjà sur /parametres, le bandeau n'est pas indispensable car SubscriptionSection l'affiche déjà
  const isOnSettings = pathname === "/parametres";

  return (
    <aside
      aria-label="Statut de l'abonnement"
      className="relative z-40 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-600/15 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 backdrop-blur-xs"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
          <AlertTriangle className="h-3.5 w-3.5" />
        </div>
        <p className="font-medium">
          <strong className="font-bold">Compte en attente d&apos;activation :</strong> Vos opérations (ventes, stocks, tickets) sont actuellement verrouillées. Choisissez une formule pour activer votre espace.
        </p>
      </div>

      {!isOnSettings && (
        <Link
          href="/parametres"
          className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1.5 text-xs shadow-xs transition active:scale-[0.98] shrink-0"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Activer mon abonnement</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </aside>
  );
}
