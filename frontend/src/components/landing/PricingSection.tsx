"use client";

import Link from "next/link";
import { Check, Sparkles, ArrowRight, ShieldCheck, Zap, Server, MessageSquareQuote, PhoneCall } from "lucide-react";

export function PricingSection() {
  const PLANS = [
    {
      id: "monthly",
      name: "Formule Mensuelle",
      badge: "Flexibilité Totale",
      badgeColor: "border-zinc-700 bg-zinc-800/80 text-zinc-300",
      tagline: "Idéal pour démarrer sans engagement et gérer votre commerce au mois le mois.",
      price: "5 000",
      period: "FCFA / mois",
      subprice: "Renouvelable chaque mois sans engagement",
      highlight: false,
      features: [
        "Accès complet à la plateforme StockPro Cloud",
        "Gestion multi-dépôts & magasins illimités",
        "Gestion complète des produits et inventaires",
        "Caisse POS & impression tickets thermiques 58/80mm",
        "Gestion des ventes, factures et créances clients",
        "Bons de commande achats et suivi fournisseurs",
        "Tableau de bord financier et marges en temps réel",
        "Paiement Mobile Money automatique via AlphaPay",
        "Support technique par WhatsApp & Email",
      ],
      cta: "Commencer en Mensuel",
      ctaLink: "/register?plan=monthly",
    },
    {
      id: "quarterly",
      name: "Formule Trimestrielle",
      badge: "Recommandé • Économisez 17%",
      badgeColor: "border-indigo-500/40 bg-indigo-500/20 text-indigo-300 shadow-sm shadow-indigo-500/20",
      tagline: "La formule favorite des commerçants et grossistes. Moins de soucis de renouvellement et 2 500 F d'économie.",
      price: "12 500",
      period: "FCFA / trimestre",
      subprice: "Soit seulement ~4 160 FCFA / mois (2 500 F d'économie)",
      highlight: true,
      features: [
        "Tout ce qui est inclus dans le forfait Mensuel",
        "Économie immédiate de 2 500 FCFA sur 3 mois",
        "Tranquillité d'esprit : 90 jours d'accès ininterrompu",
        "Historique des ventes & rapports analytiques étendus",
        "Accompagnement gratuit à la configuration initiale",
        "Importation assistée de vos premiers produits Excel",
        "Support technique prioritaire 7j/7 sur WhatsApp",
      ],
      cta: "Choisir l'offre Trimestrielle",
      ctaLink: "/register?plan=quarterly",
    },
    {
      id: "custom",
      name: "Déploiement Sur-Mesure",
      badge: "Installation Personnalisée",
      badgeColor: "border-amber-500/40 bg-amber-500/20 text-amber-300",
      tagline: "Vous souhaitez que nous déployions StockPro personnellement sur votre propre serveur ou infrastructure locale ?",
      price: "Sur Devis",
      period: "Prestation & accompagnement",
      subprice: "Installation clé en main avec formation",
      highlight: false,
      features: [
        "Installation dédiée sur votre propre serveur (VPS ou réseau local)",
        "Nom de domaine propre (ex: stock.votre-societe.com)",
        "Base de données privée et autonome à 100%",
        "Migration et importation complète de vos catalogues et stocks",
        "Personnalisation graphique de vos factures et tickets avec votre logo",
        "Formation personnalisée de vos gérants, caissiers et magasiniers",
        "Ligne directe avec l'ingénieur développeur & maintenance dédiée",
      ],
      cta: "Discuter de mon projet sur WhatsApp",
      ctaLink: "https://wa.me/22943507805?text=Bonjour,%20je%20souhaite%20un%20d%C3%A9ploiement%20sur-mesure%20de%20StockPro",
      isExternal: true,
      customIcon: Server,
    },
  ];

  return (
    <section id="tarifs" className="py-20 md:py-28 relative">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 mb-4 shadow-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Tarifs Simples, Clairs & Sans Frais Cachés</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Des tarifs adaptés à la réalité du commerce en Afrique
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400">
            Un abonnement transparent et accessible pour rentabiliser et sécuriser vos stocks dès le premier jour.
            Réglez instantanément avec <strong className="text-white">MTN, Moov, Wave ou Orange Money</strong> grâce à notre intégration sécurisée.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((plan) => {
            const isHighlight = plan.highlight;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                  isHighlight
                    ? "border-2 border-indigo-500/90 bg-gradient-to-b from-indigo-950/50 via-zinc-900/90 to-zinc-950 shadow-2xl shadow-indigo-600/25 lg:-translate-y-3"
                    : "border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700/90 hover:bg-zinc-900/60"
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3.5 py-0.5 text-[11px] font-bold tracking-wide uppercase border ${plan.badgeColor} flex items-center gap-1.5`}
                  >
                    {isHighlight && <Sparkles className="h-3 w-3" />}
                    <span>{plan.badge}</span>
                  </div>
                )}

                <div>
                  {/* Plan Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  </div>

                  <p className="mt-2 text-xs text-zinc-400 min-h-[40px] leading-relaxed">
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="mt-6 pb-6 border-b border-zinc-800/80">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                        {plan.price}
                      </span>
                      <span className="text-xs font-bold text-indigo-400 uppercase">
                        {plan.period}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 font-medium">
                      {plan.subprice}
                    </p>
                  </div>

                  {/* Feature Checklist */}
                  <div className="mt-6 space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-3">
                      Ce qui est inclus :
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
                        <span className="text-xs text-zinc-300 leading-relaxed">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="mt-8 pt-4">
                  {plan.isExternal ? (
                    <a
                      href={plan.ctaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-xl py-3.5 text-sm font-bold border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-all duration-200 active:scale-[0.98] shadow-xs"
                    >
                      <PhoneCall className="h-4 w-4" />
                      <span>{plan.cta}</span>
                    </a>
                  ) : (
                    <Link
                      href={plan.ctaLink}
                      className={`flex items-center justify-center gap-2 w-full rounded-xl py-3.5 text-sm font-bold transition-all duration-200 active:scale-[0.98] ${
                        isHighlight
                          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500"
                          : "border border-zinc-700 bg-zinc-800/90 text-white hover:bg-zinc-700"
                      }`}
                    >
                      <span>{plan.cta}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                  <p className="mt-2.5 text-center text-[11px] text-zinc-400">
                    Paiement Mobile Money sécurisé par AlphaPay
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Money & AlphaPay Banner */}
        <div className="mt-14 rounded-3xl border border-zinc-800/90 bg-gradient-to-r from-zinc-900/80 via-indigo-950/20 to-zinc-900/80 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left shadow-lg">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h4 className="text-base font-bold text-white">
                  Paiement Mobile Money instantané avec AlphaPay
                </h4>
                <span className="rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 border border-emerald-500/30">
                  Activé
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Réglez facilement en quelques secondes avec votre compte <strong>MTN Mobile Money, Moov Money, Wave, Orange Money</strong> ou Carte Bancaire. Votre abonnement s&apos;active immédiatement après confirmation de la transaction.
              </p>
            </div>
          </div>
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 px-5 py-3 text-xs font-bold transition-all shadow-sm shrink-0 whitespace-nowrap active:scale-[0.98]"
          >
            <span>Créer mon compte</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
