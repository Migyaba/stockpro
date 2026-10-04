"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Calendar,
  Smartphone,
  PhoneCall,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { fetchSubscriptionStatus, createCheckoutSession, verifyPayment } from "@/lib/api/billing";
import { formatFCFA } from "@/lib/utils/format";

export function SubscriptionSection() {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "quarterly">("monthly");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [verifyingRef, setVerifyingRef] = useState<string | null>(null);

  const { data: sub, isLoading } = useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: fetchSubscriptionStatus,
    staleTime: 30_000,
  });

  const verifyMutation = useMutation({
    mutationFn: (ref?: string) => verifyPayment(ref),
    onSuccess: (data) => {
      setVerifyingRef(null);
      if (data.is_completed) {
        setSuccessMsg(data.message || "Paiement validé avec succès ! Votre abonnement est actif.");
        setErrorMsg(null);
        queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] });
      } else {
        setErrorMsg(data.message || "Le paiement n'a pas encore été confirmé par AlphaPay.");
      }
    },
    onError: (err: any) => {
      setVerifyingRef(null);
      setErrorMsg(err?.response?.data?.error?.message || "Erreur lors de la vérification du paiement auprès d'AlphaPay.");
    },
  });

  // Détection du retour de paiement AlphaPay dans l'URL (?payment=success)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isPaymentSuccess = params.get("payment") === "success";
      const paymentRef = params.get("ref");

      if (isPaymentSuccess) {
        setSuccessMsg("Vérification de la confirmation de votre paiement en cours...");
        verifyMutation.mutate(paymentRef || undefined);

        // Nettoyage propre de l'URL sans rechargement
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleVerify = (ref: string) => {
    setVerifyingRef(ref);
    setErrorMsg(null);
    setSuccessMsg(null);
    verifyMutation.mutate(ref);
  };

  const checkoutMutation = useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (data) => {
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.error?.message || "Impossible d'initialiser le paiement AlphaPay.");
    },
  });

  const handlePay = (plan: "monthly" | "quarterly") => {
    setSelectedPlan(plan);
    setErrorMsg(null);
    checkoutMutation.mutate({
      plan,
      phone: phoneNumber,
      return_url: `${window.location.origin}/parametres?payment=success`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-zinc-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-xs">Chargement de vos informations d'abonnement...</span>
      </div>
    );
  }

  const isExpired = sub?.days_remaining === 0 && !sub?.has_active_access;

  const monthlyAmount = sub?.pricing?.monthly?.amount ?? 5000;
  const quarterlyAmount = sub?.pricing?.quarterly?.amount ?? 12500;
  const isMonthlyCustom = sub?.pricing?.monthly?.is_custom ?? false;
  const isQuarterlyCustom = sub?.pricing?.quarterly?.is_custom ?? false;
  const hasCustomPricing = sub?.has_custom_pricing || isMonthlyCustom || isQuarterlyCustom;

  // Calcul dynamique de l'économie trimestrielle
  const quarterlySavings = Math.max(0, (monthlyAmount * 3) - quarterlyAmount);
  const monthlyEquivalent = Math.round(quarterlyAmount / 3);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ─── En-tête Statut de l'Abonnement ────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Statut de l'organisation
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  sub?.has_active_access
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                }`}
              >
                {sub?.has_active_access ? "Actif & Opérationnel" : "Expiré"}
              </span>
              {hasCustomPricing && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Tarif Préférentiel</span>
                </span>
              )}
            </div>
            <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {sub?.plan === "MONTHLY"
                ? `Formule Mensuelle (${monthlyAmount.toLocaleString("fr-FR")} FCFA/mois)`
                : sub?.plan === "QUARTERLY"
                ? `Formule Trimestrielle (${quarterlyAmount.toLocaleString("fr-FR")} FCFA/trimestre)`
                : sub?.plan === "CUSTOM"
                ? "Déploiement Sur-Mesure Dédié"
                : "Période d'Essai Gratuit 14 jours"}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-center min-w-[110px]">
              <div className="text-2xl font-black">{sub?.days_remaining ?? 0}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Jours restants
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-zinc-400" />
            <span>
              Échéance :{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">
                {sub?.subscription_ends_at
                  ? new Date(sub.subscription_ends_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : sub?.trial_ends_at
                  ? new Date(sub.trial_ends_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Non définie"}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="h-4 w-4" />
            <span>Paiements Mobile Money sécurisés par AlphaPay</span>
          </div>
        </div>
      </div>

      {/* Alerte si un tarif personnalisé a été accordé par l'administrateur */}
      {hasCustomPricing && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 text-xs">
          <Sparkles className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <p>
            Votre boutique bénéficie d'un <strong>tarif préférentiel négocié</strong> accordé par l'administrateur StockPro. Les montants ci-dessous sont calculés spécialement pour votre compte.
          </p>
        </div>
      )}

      {/* Alerte si proche de l'expiration */}
      {sub && sub.days_remaining <= 5 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <p>
            Votre abonnement expire dans <strong>{sub.days_remaining} jour(s)</strong>. Renouvelez-le dès maintenant pour éviter l'interruption de vos encaissements et accès aux stocks.
          </p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* ─── Numéro de téléphone Mobile Money facultatif ─────────────── */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
        <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>Numéro Mobile Money pour le débit (Optionnel)</span>
        </label>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Ce numéro sera pré-rempli sur la page AlphaPay. Vous pouvez aussi le renseigner directement lors du paiement.
        </p>
        <input
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Ex: +229 97 00 00 00"
          className="w-full sm:max-w-md px-3.5 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {/* ─── Grille des 2 Forfaits de Renouvellement ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Forfait Mensuel */}
        <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex flex-col justify-between shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Formule Mensuelle
              </h4>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-full">
                {isMonthlyCustom ? "Tarif sur-mesure" : "Sans engagement"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Renouvellement pour 30 jours complets d'accès à StockPro.
            </p>

            <div className="flex items-baseline gap-1.5 pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {monthlyAmount.toLocaleString("fr-FR")}
              </span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                FCFA / mois
              </span>
            </div>

            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Tous les dépôts et boutiques actifs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Caisse POS & Ventes illimitées</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Support WhatsApp réactif</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            disabled={checkoutMutation.isPending}
            onClick={() => handlePay("monthly")}
            className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/20 transition active:scale-[0.98] disabled:opacity-50"
          >
            {checkoutMutation.isPending && selectedPlan === "monthly" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Renouveler pour {monthlyAmount.toLocaleString("fr-FR")} FCFA</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Forfait Trimestriel (Recommandé) */}
        <div className="rounded-2xl border-2 border-indigo-500 bg-gradient-to-b from-indigo-50/50 via-white to-white dark:from-indigo-950/30 dark:via-zinc-900 dark:to-zinc-900 p-6 flex flex-col justify-between shadow-md relative">
          {quarterlySavings > 0 && (
            <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-bold px-3 py-0.5 uppercase tracking-wider shadow-xs flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>Économisez {quarterlySavings.toLocaleString("fr-FR")} F</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Formule Trimestrielle
              </h4>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full">
                {isQuarterlyCustom ? "Tarif sur-mesure" : "Le Plus Choisi"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              90 jours d'accès complet sans coupure (revient à {monthlyEquivalent.toLocaleString("fr-FR")} F/mois).
            </p>

            <div className="flex items-baseline gap-1.5 pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {quarterlyAmount.toLocaleString("fr-FR")}
              </span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                FCFA / trimestre
              </span>
            </div>

            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Tout ce qui est dans le plan mensuel</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>90 jours de sérénité sans coupure</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Support technique prioritaire 7j/7</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            disabled={checkoutMutation.isPending}
            onClick={() => handlePay("quarterly")}
            className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition active:scale-[0.98] disabled:opacity-50"
          >
            {checkoutMutation.isPending && selectedPlan === "quarterly" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Renouveler pour {quarterlyAmount.toLocaleString("fr-FR")} FCFA</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Encadré Déploiement Sur-Mesure ─────────────────────────── */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-amber-500" />
            <span>Besoin d'un déploiement sur votre propre serveur ou réseau local ?</span>
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
            Notre équipe installe StockPro chez vous sur devis personnalisé, avec nom de domaine dédié, importation de vos catalogues et formation sur site.
          </p>
        </div>

        <a
          href="https://wa.me/22943507805?text=Bonjour,%20je%20souhaite%20un%20d%C3%A9ploiement%20sur-mesure%20de%20StockPro"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 text-xs font-bold whitespace-nowrap transition"
        >
          Contacter sur WhatsApp
        </a>
      </div>

      {/* ─── Historique des Paiements Réussis ───────────────────────── */}
      {sub?.recent_payments && sub.recent_payments.length > 0 && (
        <div className="rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Historique des Factures & Règlements
            </h4>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Référence</th>
                <th className="py-2.5 px-4 font-semibold">Plan</th>
                <th className="py-2.5 px-4 font-semibold">Montant</th>
                <th className="py-2.5 px-4 font-semibold">Date</th>
                <th className="py-2.5 px-4 font-semibold text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {sub.recent_payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 px-4 font-mono font-medium">{p.reference}</td>
                  <td className="py-3 px-4">
                    {p.plan === "MONTHLY" ? "Mensuel" : "Trimestriel"}
                  </td>
                  <td className="py-3 px-4 font-bold">{formatFCFA(p.amount)}</td>
                  <td className="py-3 px-4 text-zinc-400">
                    {new Date(p.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : p.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {p.status === "COMPLETED"
                          ? "Payé"
                          : p.status === "PENDING"
                          ? "En attente"
                          : p.status}
                      </span>
                      {p.status === "PENDING" && (
                        <button
                          type="button"
                          disabled={verifyMutation.isPending && verifyingRef === p.reference}
                          onClick={() => handleVerify(p.reference)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 dark:hover:bg-indigo-900 border border-indigo-200/50 dark:border-indigo-800 transition active:scale-95 disabled:opacity-50"
                          title="Interroger AlphaPay pour confirmer ce paiement"
                        >
                          {verifyMutation.isPending && verifyingRef === p.reference ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          <span>Vérifier</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
