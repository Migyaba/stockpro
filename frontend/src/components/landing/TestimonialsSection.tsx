"use client";

import { Star, Quote, Building2, MapPin } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "El-Hadj Ousmane K.",
    role: "Fondateur & Directeur Général",
    business: "Société Générale de Matériaux & Quincaillerie",
    city: "Cotonou (Bénin)",
    avatarText: "OK",
    stars: 5,
    quote:
      "Avant StockPro, j'avais 3 entrepôts entre Dantokpa et Akpakpa et je perdais des millions chaque fin de mois en écarts de stock inexpliqués. Depuis qu'on l'a installé, chaque carton qui bouge a un responsable. Je dors enfin tranquille.",
  },
  {
    name: "Fatoumata Diop",
    role: "Responsable Réseau de Boutiques",
    business: "Aura Cosmétiques & Parfumerie",
    city: "Dakar (Sénégal)",
    avatarText: "FD",
    stars: 5,
    quote:
      "La caisse POS est d'une simplicité incroyable. Mes vendeuses l'ont maîtrisée en une matinée. Mais ce qui a sauvé ma trésorerie, c'est le module de créances clients : on a récupéré plus de 4,5 millions FCFA d'impayés en 45 jours.",
  },
  {
    name: "Christian Mian",
    role: "Gérant Associé",
    business: "Mian Electro & Distribution Froid",
    city: "Abidjan (Côte d'Ivoire)",
    avatarText: "CM",
    stars: 5,
    quote:
      "Le calcul automatique du PUMP change tout quand on fait de l'importation de conteneurs. On sait exactement quel bénéfice net on dégage sur chaque climatiseur vendu, sans risquer de vendre à perte.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28 bg-zinc-950/60 border-t border-zinc-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 mb-4">
            <span>Témoignages Clients</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ils ont transformé leur gestion commerciale avec StockPro
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400">
            Découvrez comment des entrepreneurs et chefs d&apos;entreprises sécurisent leur chiffre d&apos;affaires au quotidien.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-lg relative"
            >
              <div>
                {/* 5 Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.stars)].map((_, s) => (
                    <Star
                      key={s}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                <Quote className="h-8 w-8 text-indigo-500/30 mb-2" />

                <p className="text-sm text-zinc-300 leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-zinc-800/80 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 font-bold text-white text-sm shadow-md">
                  {t.avatarText}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{t.name}</span>
                  <span className="text-xs text-zinc-400">{t.role}</span>
                  <div className="flex items-center gap-1 text-[11px] text-indigo-400 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    <span>{t.city}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
