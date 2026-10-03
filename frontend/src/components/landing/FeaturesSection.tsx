"use client";

import {
  Warehouse,
  Receipt,
  ShieldCheck,
  Calculator,
  Users2,
  Globe2,
  Smartphone,
  BarChart3,
  FileSpreadsheet,
} from "lucide-react";

const FEATURES = [
  {
    icon: Warehouse,
    title: "Multi-Dépôts & Réseau d'Agences",
    desc: "Supervisez vos entrepôts, conteneurs et points de vente en temps réel. Réalisez des transferts inter-agences sécurisés avec bons de transfert audités.",
    badge: "Indispensable pour grossistes",
    color: "from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/30",
  },
  {
    icon: Receipt,
    title: "Caisse POS & Factures Officielles A4",
    desc: "Émettez des tickets de caisse thermiques en un éclair au comptoir ou générez des factures proforma et définitives A4 conformes aux normes fiscales.",
    badge: "Tickets 58/80mm & A4",
    color: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30",
  },
  {
    icon: ShieldCheck,
    title: "Sécurité Anti-Fraude & Rôles Étanches",
    desc: "Les caissiers encaissent sans jamais voir vos prix d'achat ni vos marges. Les suppressions de factures sont strictement verrouillées par code patron.",
    badge: "Zéro coulage de caisse",
    color: "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/30",
  },
  {
    icon: Calculator,
    title: "Calcul du PUMP & Marges Nettes",
    desc: "Fini les estimations hasardeuses. StockPro recalcule automatiquement le Prix Unitaire Moyen Pondéré à chaque livraison pour afficher vos bénéfices réels.",
    badge: "Comptabilité exacte",
    color: "from-violet-500/20 to-violet-500/5 text-violet-400 border-violet-500/30",
  },
  {
    icon: Users2,
    title: "Suivi des Créances & Dettes Fournisseurs",
    desc: "Gérez les ventes à crédit, les acomptes partiels et l'échéancier des paiements. Sachez exactement qui vous doit quoi et relancez au bon moment.",
    badge: "Récupération d'impayés",
    color: "from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/30",
  },
  {
    icon: Globe2,
    title: "100% Adapté aux Réalités d'Afrique",
    desc: "Paramétré nativement en FCFA (XOF / XAF), compatible Mobile Money (MTN, Moov, Orange, Wave), optimisé pour charger rapidement sur tous vos appareils.",
    badge: "XOF • XAF • Mobile Money",
    color: "from-teal-500/20 to-teal-500/5 text-teal-400 border-teal-500/30",
  },
];

export function FeaturesSection() {
  return (
    <section id="fonctionnalites" className="py-20 md:py-28 bg-zinc-950/70 border-t border-zinc-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 mb-4">
            <span>Fonctionnalités Piliers</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Tout ce dont votre commerce a besoin pour prospérer
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400">
            Une interface moderne et intuitive conçue pour que vos caissiers et magasiniers soient opérationnels en moins de 10 minutes d&apos;apprentissage.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-7 flex flex-col justify-between hover:border-zinc-700 hover:bg-zinc-900/70 transition-all duration-300 hover:-translate-y-1 shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feat.color} border shadow-inner`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {feat.title}
                  </h3>

                  <p className="mt-2.5 text-sm text-zinc-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                  <span>Inclus dans tous les forfaits</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
