"use client";

import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background radial glows and gradient grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[650px] w-[950px] rounded-full bg-gradient-to-b from-indigo-600/25 via-violet-600/15 to-transparent blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-[120px]"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur-md mb-8 hover:bg-indigo-500/15 transition-colors">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Solution SaaS B2B N°1 en Afrique Francophone</span>
            <span className="hidden sm:inline text-zinc-500">•</span>
            <span className="hidden sm:inline text-zinc-300">Conforme FCFA (XOF & XAF)</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white text-balance leading-[1.12]">
            Maîtrisez vos <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">stocks</span>, vos <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">ventes</span> et votre trésorerie sans aucune perte.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-zinc-300 text-balance max-w-2xl font-normal leading-relaxed">
            La plateforme tout-en-un conçue sur-mesure pour les grossistes, boutiques, importateurs et distributeurs. Fini les vols invisibles, les calculs d&apos;inventaire interminables et les ruptures imprévues.
          </p>

          {/* Call to Actions (Tunnel de Conversion) */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              href="/register"
              className="flex items-center justify-center gap-3 w-full sm:w-auto rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Démarrer l&apos;essai gratuit de 7 jours</span>
              <ArrowRight className="h-5 w-5" />
            </Link>

            <a
              href="#comparatif"
              className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl border border-zinc-700 bg-zinc-900/60 backdrop-blur-sm px-6 py-4 text-base font-semibold text-zinc-200 hover:bg-zinc-800/80 hover:text-white transition-all"
            >
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Découvrir la méthode StockPro</span>
            </a>
          </div>

          {/* Micro-assurances / Friction reducers */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Aucune carte bancaire requise</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Prêt à l&apos;emploi en 2 minutes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Support WhatsApp 7j/7</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Données 100% sécurisées</span>
            </div>
          </div>
        </div>

        {/* Live Interactive SaaS Mockup Card */}
        <div className="mt-16 sm:mt-20 relative max-w-5xl mx-auto">
          {/* Subtle glowing halo border */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500/30 via-violet-500/20 to-emerald-500/20 blur-xl opacity-70" />

          <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Mockup Top Window Bar */}
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-medium text-zinc-400 hidden sm:inline">
                  stockpro.app — Tableau de Bord Direction
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/80 px-2.5 py-1 text-xs text-zinc-300">
                  <Warehouse className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Dépôt Central (Cotonou)</span>
                </div>
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
            </div>

            {/* Mockup Dashboard Content */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
              {/* Metric KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 transition-all hover:border-zinc-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-400">Chiffre d&apos;Affaires (Mois)</span>
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="mt-2 text-lg sm:text-2xl font-bold tracking-tight text-white">
                    18 450 000 <span className="text-xs text-zinc-400 font-normal">FCFA</span>
                  </p>
                  <p className="mt-1 text-xs text-emerald-400 font-medium">
                    +24.8% vs mois précédent
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 transition-all hover:border-zinc-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-400">Ventes du Jour</span>
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                  </div>
                  <p className="mt-2 text-lg sm:text-2xl font-bold tracking-tight text-white">
                    1 420 000 <span className="text-xs text-zinc-400 font-normal">FCFA</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    42 tickets émis
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 transition-all hover:border-zinc-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-400">Valeur Totale Stock</span>
                    <Layers className="h-4 w-4 text-violet-400" />
                  </div>
                  <p className="mt-2 text-lg sm:text-2xl font-bold tracking-tight text-white">
                    48 900 000 <span className="text-xs text-zinc-400 font-normal">FCFA</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    3 Entrepôts connectés
                  </p>
                </div>

                <div className="rounded-xl border border-rose-900/30 bg-rose-950/20 p-4 transition-all hover:border-rose-800/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-rose-300">Alertes Ruptures</span>
                    <AlertTriangle className="h-4 w-4 text-rose-400 animate-bounce" />
                  </div>
                  <p className="mt-2 text-lg sm:text-2xl font-bold tracking-tight text-rose-200">
                    2 Articles
                  </p>
                  <p className="mt-1 text-xs text-rose-400/90 font-medium">
                    Réapprovisionnement urgent
                  </p>
                </div>
              </div>

              {/* Middle Row: Recent Sales & Live Inventory Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Table: Recent transactions */}
                <div className="lg:col-span-2 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Package className="h-4 w-4 text-indigo-400" />
                      <span>Dernières Ventes Enregistrées</span>
                    </h2>
                    <span className="text-[11px] text-zinc-400 font-mono">Synchronisation instantanée</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500 font-medium">
                          <th className="pb-2.5">Facture #</th>
                          <th className="pb-2.5">Client</th>
                          <th className="pb-2.5">Montant</th>
                          <th className="pb-2.5">Règlement</th>
                          <th className="pb-2.5 text-right">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                        <tr>
                          <td className="py-2.5 font-mono text-indigo-300">FA-2026-0841</td>
                          <td className="py-2.5 font-medium text-white">ETS Kouassi & Frères</td>
                          <td className="py-2.5 font-semibold">450 000 FCFA</td>
                          <td className="py-2.5">Mobile Money (MTN)</td>
                          <td className="py-2.5 text-right">
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                              Encaissé
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-mono text-indigo-300">FA-2026-0840</td>
                          <td className="py-2.5 font-medium text-white">Quincaillerie Moderne</td>
                          <td className="py-2.5 font-semibold">1 250 000 FCFA</td>
                          <td className="py-2.5">Chèque certifié</td>
                          <td className="py-2.5 text-right">
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                              Encaissé
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-mono text-indigo-300">FA-2026-0839</td>
                          <td className="py-2.5 font-medium text-white">Alimentation Générale Sahel</td>
                          <td className="py-2.5 font-semibold">185 000 FCFA</td>
                          <td className="py-2.5">Espèces au comptoir</td>
                          <td className="py-2.5 text-right">
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                              Encaissé
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Live Stock Alert Widget */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                        Contrôle Anti-Pertes
                      </span>
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      StockPro surveille vos marges et vos inventaires en continu pour empêcher toute dérive de caisse.
                    </p>

                    <div className="mt-4 space-y-2.5">
                      <div className="rounded-lg bg-zinc-800/60 p-2.5 border border-zinc-700/50">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300 font-medium">Ciment CPJ 42.5 (Sacs)</span>
                          <span className="text-rose-400 font-bold">12 restants</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full bg-zinc-700 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full w-[15%]" />
                        </div>
                        <span className="text-[10px] text-zinc-400 mt-1 block">Seuil d&apos;alerte: 50 sacs</span>
                      </div>

                      <div className="rounded-lg bg-zinc-800/60 p-2.5 border border-zinc-700/50">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300 font-medium">Fer à béton 12mm (Tonne)</span>
                          <span className="text-emerald-400 font-bold">45 en stock</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full bg-zinc-700 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full w-[75%]" />
                        </div>
                        <span className="text-[10px] text-zinc-400 mt-1 block">Niveau optimal</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Audit traçabilité :</span>
                    <span className="text-emerald-400 font-semibold">100% vérifié</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
