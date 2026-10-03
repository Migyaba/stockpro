"use client";

import { Building, MapPin, Users, Coins, TrendingUp, ShieldCheck } from "lucide-react";

const HUBS = [
  { city: "Cotonou", country: "Bénin" },
  { city: "Abidjan", country: "Côte d'Ivoire" },
  { city: "Dakar", country: "Sénégal" },
  { city: "Lomé", country: "Togo" },
  { city: "Douala", country: "Cameroun" },
  { city: "Ouagadougou", country: "Burkina Faso" },
];

const STATS = [
  {
    value: "+150",
    label: "Commerces & Grossistes",
    sub: "Actifs au quotidien sur la plateforme",
    icon: Building,
  },
  {
    value: "4.2 Mds",
    unit: "FCFA",
    label: "De transactions sécurisées",
    sub: "Sans fuite de caisse ni perte",
    icon: Coins,
  },
  {
    value: "-85%",
    label: "D'écarts d'inventaire",
    sub: "Constatés dès le premier mois d'utilisation",
    icon: TrendingUp,
  },
  {
    value: "99.98%",
    label: "Disponibilité Cloud",
    sub: "Accessible 24h/24 sur PC et mobile",
    icon: ShieldCheck,
  },
];

export function StatsSection() {
  return (
    <section className="border-y border-zinc-800/80 bg-zinc-950/60 py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* City hub chips */}
        <div className="flex flex-col items-center justify-center text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
            Adopté par les distributeurs et commerçants de référence à travers l&apos;Afrique
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {HUBS.map((hub) => (
              <div
                key={hub.city}
                className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 text-xs text-zinc-300 shadow-sm"
              >
                <MapPin className="h-3 w-3 text-indigo-400" />
                <span className="font-medium text-white">{hub.city}</span>
                <span className="text-zinc-500">({hub.country})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="flex flex-col items-center text-center p-4 rounded-xl border border-zinc-800/40 bg-zinc-900/20 hover:border-zinc-700/60 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-400 mb-3 border border-indigo-500/20">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {stat.value}
                  </span>
                  {stat.unit && (
                    <span className="text-xs sm:text-sm font-bold text-indigo-400">
                      {stat.unit}
                    </span>
                  )}
                </div>
                <span className="mt-1 text-sm font-semibold text-zinc-200">
                  {stat.label}
                </span>
                <span className="mt-0.5 text-xs text-zinc-400 max-w-[200px]">
                  {stat.sub}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
