"use client";

import { XCircle, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

const PAIN_POINTS = [
  {
    title: "Cahiers raturés et fichiers Excel instables",
    desc: "Des heures perdues à recalculer manuellement le stock sans jamais être sûr des chiffres exacts.",
  },
  {
    title: "Vols internes et écarts d'inventaire inexpliqués",
    desc: "Des marchandises qui disparaissent entre les rayons et la caisse sans responsable identifiable.",
  },
  {
    title: "Pertes opaques lors des transferts inter-dépôts",
    desc: "Le camion part avec 100 cartons de l'entrepôt mais la boutique n'en réceptionne que 92 sans preuve formelle.",
  },
  {
    title: "Prisonnier de votre magasin pour surveiller la caisse",
    desc: "Impossible de voyager, négocier avec vos fournisseurs ou vous reposer sans craindre une fuite de fonds.",
  },
  {
    title: "Créances clients oubliées et argent dehors",
    desc: "Des millions de FCFA de dettes accordées aux clients sur parole qui ne sont jamais réclamées à temps.",
  },
];

const SOLUTIONS = [
  {
    title: "Inventaire et valorisation PUMP en temps réel",
    desc: "Chaque entrée et sortie met à jour instantanément la quantité restante et votre coût de revient moyen.",
  },
  {
    title: "Traçabilité 100% auditable et rôles verrouillés",
    desc: "Chaque action est enregistrée avec le nom de l'employé, l'heure exacte et le poste. Zéro falsification.",
  },
  {
    title: "Bons de transferts sécurisés à double validation",
    desc: "Le dépôt expéditeur valide la sortie, le dépôt récepteur certifie la conformité à l'arrivée avec signature.",
  },
  {
    title: "Pilotage total à distance sur votre smartphone",
    desc: "Consultez le chiffre d'affaires, les marges et les mouvements de n'importe où, même à l'étranger.",
  },
  {
    title: "Suivi rigoureux des créances & relances planifiées",
    desc: "Historique clair des acomptes, alertes d'échéances et fiches de créances par client en un coup d'œil.",
  },
];

export function ProblemSolutionSection() {
  return (
    <section id="comparatif" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 mb-4">
            <span>Le Constat Sans Filtre</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Pourquoi les méthodes traditionnelles vous coûtent une fortune chaque mois ?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400">
            Gérer un commerce rentable en Afrique ne s&apos;improvise pas. Découvrez la différence radicale entre l&apos;ancienne gestion et l&apos;efficacité StockPro.
          </p>
        </div>

        {/* Comparison Dual Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Avant Stockpro (Negative / Red) */}
          <div className="rounded-2xl border border-rose-900/40 bg-gradient-to-b from-rose-950/20 to-zinc-950 p-6 sm:p-8 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-rose-900/30">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    Méthode Classique
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Cahiers, Excel & Confiance Aveugle
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 space-y-5">
                {PAIN_POINTS.map((pain, i) => (
                  <div key={i} className="flex items-start gap-3.5">
                    <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-rose-200">
                        {pain.title}
                      </h4>
                      <p className="mt-0.5 text-xs text-zinc-400 leading-relaxed">
                        {pain.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-rose-900/30 text-center">
              <span className="text-xs font-semibold text-rose-400/90">
                Résultat : Des fuites de trésorerie invisibles de 5% à 15% chaque mois.
              </span>
            </div>
          </div>

          {/* Avec StockPro (Positive / Emerald & Indigo) */}
          <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-b from-indigo-950/30 via-zinc-900/80 to-zinc-950 p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative">
            {/* Top highlight badge */}
            <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 px-3 py-1 text-[11px] font-bold text-black uppercase tracking-wide shadow-md">
              La Solution Éprouvée
            </div>

            <div>
              <div className="flex items-center justify-between pb-6 border-b border-indigo-500/20">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Avec STOCKPRO
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Gestion Digitale & Contrôle Absolu
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 space-y-5">
                {SOLUTIONS.map((sol, i) => (
                  <div key={i} className="flex items-start gap-3.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        {sol.title}
                      </h4>
                      <p className="mt-0.5 text-xs text-zinc-300 leading-relaxed">
                        {sol.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs font-semibold text-emerald-400">
                Résultat : Rentabilité maximale, sommeil paisible et sérénité.
              </span>
              <Link
                href="/register"
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg transition-colors shadow-md"
              >
                <span>Tester maintenant</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
