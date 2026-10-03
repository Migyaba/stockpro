"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  const PLANS = [
    {
      id: "starter",
      name: "Starter",
      tagline: "Idéal pour une boutique unique ou un commerce de détail démarrant.",
      priceMonthly: "15 000",
      priceAnnual: "12 500",
      totalAnnual: "150 000",
      badge: null,
      highlight: false,
      features: [
        "1 Dépôt / Boutique unique",
        "2 Comptes utilisateurs inclus",
        "Ventes et produits illimités",
        "Point de Vente (POS) & Tickets thermiques",
        "Gestion des contacts (Clients & Fournisseurs)",
        "Historique des ventes sur 12 mois",
        "Support par Email & Centre d'aide",
      ],
      cta: "Démarrer avec Starter",
      ctaLink: "/register?plan=starter",
    },
    {
      id: "pro",
      name: "Professionnel",
      tagline: "Le choix N°1 des grossistes, commerçants établis et multi-boutiques.",
      priceMonthly: "35 000",
      priceAnnual: "29 000",
      totalAnnual: "350 000",
      badge: "Le Plus Populaire",
      highlight: true,
      features: [
        "Jusqu'à 3 Dépôts / Magasins connectés",
        "5 Comptes utilisateurs avec rôles étanches",
        "Tout ce qui est dans Starter, plus :",
        "Transferts inter-dépôts sécurisés & bons de transfert",
        "Factures officielles A4 personnalisées avec logo",
        "Gestion poussée des créances clients & alertes",
        "Calcul automatique du PUMP et marges nettes",
        "Alertes de rupture de stock automatiques",
        "Support WhatsApp Prioritaire 7j/7",
      ],
      cta: "Tester l'offre Pro 14 jours",
      ctaLink: "/register?plan=pro",
    },
    {
      id: "enterprise",
      name: "Entreprise",
      tagline: "Pour les réseaux de distribution, importateurs et grands grossistes.",
      priceMonthly: "75 000",
      priceAnnual: "62 500",
      totalAnnual: "750 000",
      badge: "Sur-Mesure",
      highlight: false,
      features: [
        "Nombre de Dépôts et Magasins ILLIMITÉ",
        "Nombre d'Utilisateurs ILLIMITÉ",
        "Tout ce qui est dans Professionnel, plus :",
        "Piste d'audit complète et historique permanent",
        "Multi-devises automatique (FCFA, MAD, EUR, USD)",
        "Accès API & exports comptables sur-mesure",
        "Formation de vos caissiers et magasiniers",
        "Gestionnaire de compte dédié avec assistance VIP",
      ],
      cta: "Choisir l'offre Entreprise",
      ctaLink: "/register?plan=enterprise",
    },
  ];

  return (
    <section id="tarifs" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 mb-4">
            <span>Tarifs Clairs & Sans Surprise</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Un investissement rentabilisé dès la première semaine
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400">
            Choisissez le forfait qui correspond à la taille de votre commerce. Tous les forfaits débutent par un <strong className="text-white">essai gratuit de 14 jours</strong> sans carte bancaire requise.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900/80 p-1.5 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all ${
                !isAnnual
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Facturation Mensuelle
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all ${
                isAnnual
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>Facturation Annuelle</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                2 mois offerts !
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((plan) => {
            const isHighlight = plan.highlight;
            const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                  isHighlight
                    ? "border-2 border-indigo-500 bg-gradient-to-b from-indigo-950/40 via-zinc-900/90 to-zinc-950 shadow-2xl shadow-indigo-600/20 lg:-translate-y-2"
                    : "border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
                }`}
              >
                {/* Popular Badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-1 text-xs font-bold text-white shadow-md shadow-indigo-500/30 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{plan.badge}</span>
                  </div>
                )}

                <div>
                  {/* Plan Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  </div>

                  <p className="mt-2 text-xs text-zinc-400 min-h-[36px]">
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="mt-6 pb-6 border-b border-zinc-800 flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                      {price}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-indigo-400 uppercase">
                        FCFA / mois
                      </span>
                      {isAnnual && (
                        <span className="text-[10px] text-zinc-400">
                          {plan.totalAnnual} FCFA facturés/an
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="mt-6 space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Fonctionnalités incluses :
                    </span>
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full shrink-0 mt-0.5 ${
                            isHighlight
                              ? "bg-indigo-500/20 text-indigo-400"
                              : "bg-zinc-800 text-emerald-400"
                          }`}
                        >
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-xs text-zinc-300">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="mt-8 pt-4">
                  <Link
                    href={plan.ctaLink}
                    className={`flex items-center justify-center gap-2 w-full rounded-xl py-3.5 text-sm font-bold transition-all duration-200 active:scale-[0.98] ${
                      isHighlight
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500"
                        : "border border-zinc-700 bg-zinc-800/80 text-white hover:bg-zinc-700"
                    }`}
                  >
                    <span>{plan.cta}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="mt-2.5 text-center text-[11px] text-zinc-400">
                    14 jours d&apos;essai gratuit • Sans engagement
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Money & Payment Banner */}
        <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Moyens de Paiement 100% Locaux & Flexibles
              </h4>
              <p className="text-xs text-zinc-400">
                Réglez facilement par <strong>MTN Mobile Money, Moov Money, Orange Money, Wave</strong>, Carte Bancaire Visa/Mastercard ou Virement.
              </p>
            </div>
          </div>
          <Link
            href="/register"
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Démarrer sans payer aujourd&apos;hui</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
