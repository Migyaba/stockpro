"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Boxes,
  ShoppingCart,
  AlertTriangle,
  Truck,
  LayoutDashboard,
  Package,
  Users,
  ClipboardCheck,
  BarChart3,
  Settings,
  Bell,
  Sun,
  ChevronDown,
  Search,
  SlidersHorizontal,
  Eye,
  RefreshCw,
  Plus,
  Building2,
  Warehouse,
} from "lucide-react";

// Données d'exemple. Structure et libellés repris du vrai tableau de bord
// (app/(app)/dashboard) : indicateurs, statistiques du mois et tableau de stock.
const SALE = {
  amount: 22_500,
  qty: 3,
  sku: "HUI5-0118",
  product: "Huile végétale 5 L",
  warehouse: "Boutique Dantokpa",
};
const SALES_BEFORE = 486_500;
const ORDERS_BEFORE = 23;

// Même ordre et mêmes libellés que components/layout/Sidebar.tsx.
const NAV = [
  { label: "Tableau de bord", icon: LayoutDashboard },
  { label: "Ventes", icon: ShoppingCart },
  { label: "Produits", icon: Package },
  { label: "Stock", icon: Boxes },
  { label: "Achats", icon: Truck },
  { label: "Contacts", icon: Users },
  { label: "Inventaires", icon: ClipboardCheck },
  { label: "Rapports", icon: BarChart3 },
];

type Level = "normal" | "low" | "out";

const ROWS: { name: string; sku: string; depot: string; qty: number; level: Level; sell: number; buy: number }[] = [
  {
    name: "Riz parfumé 25 kg",
    sku: "RIZ25-0412",
    depot: "Dépôt Akpakpa",
    qty: 140,
    level: "normal",
    sell: 18_500,
    buy: 15_200,
  },
  {
    name: "Huile végétale 5 L",
    sku: "HUI5-0118",
    depot: "Boutique Dantokpa",
    qty: 6,
    level: "low",
    sell: 7_500,
    buy: 6_100,
  },
  {
    name: "Lait en poudre 400 g",
    sku: "LAI4-0233",
    depot: "Dépôt Akpakpa",
    qty: 11,
    level: "low",
    sell: 2_900,
    buy: 2_350,
  },
  {
    name: "Sucre en morceaux 1 kg",
    sku: "SUC1-0090",
    depot: "Boutique Cadjèhoun",
    qty: 0,
    level: "out",
    sell: 700,
    buy: 560,
  },
  {
    name: "Savon de ménage 400 g",
    sku: "SAV4-0305",
    depot: "Boutique Dantokpa",
    qty: 64,
    level: "normal",
    sell: 400,
    buy: 310,
  },
];

const LEVEL: Record<Level, { label: string; className: string }> = {
  normal: { label: "Normal", className: "bg-emerald-500/10 text-emerald-300" },
  low: { label: "Faible", className: "bg-amber-500/10 text-amber-300" },
  out: { label: "Rupture", className: "bg-rose-500/10 text-rose-300" },
};

// Ventes TTC des 7 derniers jours, en milliers de FCFA.
const WEEK = [380, 452, 410, 528, 476, 395, 487];

const ease = "ease-[cubic-bezier(0.16,1,0.3,1)]";

// Largeur de rendu de la maquette. En dessous, elle est réduite d'un bloc,
// comme une capture d'écran, au lieu de se réorganiser.
const DESIGN_WIDTH = 1120;

function useFitToWidth() {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ scale: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const update = () => {
      const scale = Math.min(1, o.clientWidth / DESIGN_WIDTH);
      // offsetHeight ignore la transformation : c'est la hauteur à l'échelle 1.
      setFit({ scale, height: i.offsetHeight * scale });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(o);
    observer.observe(i);
    return () => observer.disconnect();
  }, []);

  return { outer, inner, fit };
}

function formatNumber(n: number) {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Le moment animé de la page : une vente arrive, les indicateurs et le stock
// suivent. Joué une seule fois, et pas du tout sous prefers-reduced-motion.
function useLiveSale() {
  const [phase, setPhase] = useState<"idle" | "toast" | "done">("idle");
  const [sales, setSales] = useState(SALES_BEFORE);
  const raf = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timers = [
      window.setTimeout(() => {
        setPhase("toast");
        const start = performance.now();
        const duration = 900;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(2, -10 * t);
          setSales(SALES_BEFORE + SALE.amount * (t === 1 ? 1 : eased));
          if (t < 1) raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
      }, 2400),
      window.setTimeout(() => setPhase("done"), 6400),
    ];

    return () => {
      timers.forEach(window.clearTimeout);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return { phase, sales, sold: phase !== "idle" };
}

function Sparkline() {
  const max = Math.max(...WEEK);
  const min = Math.min(...WEEK) * 0.8;
  const pts = WEEK.map((v, i) => `${(i / (WEEK.length - 1)) * 100},${30 - ((v - min) / (max - min)) * 26}`).join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="mt-3 h-8 w-full overflow-visible">
      <defs>
        <linearGradient id="lp-spark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="rgb(129 140 248)" stopOpacity="0.35" />
          <stop offset="1" stopColor="rgb(129 140 248)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,32 ${pts} 100,32`} fill="url(#lp-spark)" />
      <polyline
        points={pts}
        fill="none"
        stroke="rgb(165 180 252)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

const panel = "rounded-xl border border-white/[0.07] bg-[#15151d]";

export function HeroDashboard() {
  const { phase, sales, sold } = useLiveSale();
  const { outer, inner, fit } = useFitToWidth();
  const scaled = fit !== null && fit.scale < 1;

  const kpis = [
    {
      label: "Valeur totale du stock",
      value: "12,4 M FCFA",
      note: "318 produits actifs",
      icon: Boxes,
      tile: "bg-indigo-500/15 text-indigo-300",
    },
    {
      label: "Ventes du jour",
      value: `${formatNumber(sales)} FCFA`,
      note: `${sold ? ORDERS_BEFORE + 1 : ORDERS_BEFORE} commandes`,
      icon: ShoppingCart,
      tile: "bg-emerald-500/15 text-emerald-300",
      live: true,
    },
    {
      label: "Stock faible / rupture",
      value: "2 / 1",
      note: "sous le seuil / épuisés",
      icon: AlertTriangle,
      tile: "bg-rose-500/15 text-rose-300",
      warn: true,
    },
    {
      label: "Commandes en attente",
      value: "2",
      note: "achats à réceptionner",
      icon: Truck,
      tile: "bg-orange-500/15 text-orange-300",
    },
  ];

  const stats = [
    { label: "Ventes · 7 derniers jours", value: "3,13 M FCFA", note: "CA TTC", spark: true },
    { label: "Ventes · ce mois", value: "8,94 M FCFA", note: "312 ventes validées" },
    { label: "Marge brute · ce mois", value: "2,42 M FCFA", note: "27,1 % du CA HT" },
    { label: "Achats · ce mois", value: "5,61 M FCFA", note: "commandes confirmées" },
  ];

  return (
    <figure className="relative">
      <figcaption className="sr-only">
        Aperçu du tableau de bord StockPro avec des données d&apos;exemple : valeur du stock, ventes du jour, produits
        sous le seuil, commandes en attente, ventes de la semaine et tableau de stock par dépôt.
      </figcaption>

      {/* Notification de vente, posée au-dessus du cadre */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -top-[5.75rem] right-4 z-20 w-[min(19rem,calc(100%-2rem))] rounded-2xl border border-white/10 bg-[#1a1a26]/95 p-3.5 shadow-[0_24px_48px_-16px_rgb(0_0_0/0.9)] backdrop-blur transition-[opacity,transform,filter] duration-500 sm:right-10 ${ease} ${
          phase === "toast" ? "translate-y-0 opacity-100 blur-0" : "-translate-y-2 opacity-0 blur-[3px]"
        }`}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
            <ShoppingCart className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-lp-ink">Nouvelle vente</p>
              <p className="text-sm font-semibold tabular-nums text-lp-ink whitespace-nowrap">
                {formatNumber(SALE.amount)} <span className="text-xs font-normal text-lp-ink-3">FCFA</span>
              </p>
            </div>
            <p className="mt-0.5 truncate text-xs text-lp-ink-2">
              {SALE.qty} × {SALE.product}
            </p>
            <p className="truncate text-xs text-lp-ink-3">{SALE.warehouse} · stock mis à jour</p>
          </div>
        </div>
      </div>

      {/* Avant la mesure, la maquette reste masquée sur les écrans étroits pour
          ne pas montrer un rendu tronqué. */}
      <div
        ref={outer}
        data-fit={fit ? "ready" : "pending"}
        className="relative data-[fit=pending]:max-xl:invisible"
        style={scaled ? { height: fit.height } : undefined}
      >
        <div
          ref={inner}
          className="lp-spin-border origin-top-left rounded-[28px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.08]"
          style={scaled ? { width: DESIGN_WIDTH, transform: `scale(${fit.scale})` } : undefined}
        >
          <div
            aria-hidden
            className="relative flex overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#0e0e14] text-left shadow-lp"
          >
            {/* Barre latérale */}
            <aside className="flex w-52 shrink-0 flex-col border-r border-white/[0.06]">
              <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lp-mark text-white">
                  <Package className="h-4 w-4" />
                </span>
                <span className="leading-tight">
                  <span className="block text-[13px] font-bold tracking-tight text-lp-ink">STOCKPRO</span>
                  <span className="block text-[10px] text-lp-ink-3">ETS KOUASSI</span>
                </span>
              </div>
              <ul className="flex-1 space-y-0.5 p-2">
                {NAV.map(({ label, icon: Icon }, i) => (
                  <li
                    key={label}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] ${
                      i === 0 ? "bg-indigo-500/15 font-medium text-indigo-200" : "text-lp-ink-2"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </li>
                ))}
              </ul>
              <div className="border-t border-white/[0.06] p-2">
                <span className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-lp-ink-2">
                  <Settings className="h-4 w-4" />
                  Paramètres
                </span>
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              {/* Barre du haut */}
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-2.5">
                <div className="mx-auto flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-md border border-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-lp-ink-2">
                    <Building2 className="h-3.5 w-3.5" />
                    ETS KOUASSI
                  </span>
                  <span className="flex items-center gap-1.5 rounded-md border border-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-lp-ink-2">
                    <Warehouse className="h-3.5 w-3.5" />
                    Tous les dépôts
                    <ChevronDown className="h-3 w-3" />
                  </span>
                </div>
                <div className="flex items-center gap-3 text-lp-ink-3">
                  <span className="relative">
                    <Bell className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-400" />
                  </span>
                  <Sun className="h-4 w-4" />
                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-[11px] font-semibold text-indigo-200">
                      A
                    </span>
                    <span className="leading-tight">
                      <span className="block text-[11px] text-lp-ink">aminata@etskouassi.bj</span>
                      <span className="mt-0.5 inline-block rounded bg-indigo-500/20 px-1.5 text-[10px] text-indigo-200">
                        Propriétaire
                      </span>
                    </span>
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-5">
                {/* En-tête de page */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-lp-ink">Tableau de bord</p>
                    <p className="text-xs text-lp-ink-3">
                      Vue d&apos;ensemble des stocks et de l&apos;activité du jour
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-md border border-white/[0.08] px-2.5 py-1.5 text-xs text-lp-ink-2">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Actualiser
                    </span>
                    <span className="flex items-center gap-1.5 rounded-md bg-lp-brand px-2.5 py-1.5 text-xs font-medium text-white">
                      <Plus className="h-3.5 w-3.5" />
                      Nouveau produit
                    </span>
                  </div>
                </div>

                {/* Indicateurs */}
                <div className="grid grid-cols-4 gap-3">
                  {kpis.map((k) => {
                    const Icon = k.icon;
                    return (
                      <div
                        key={k.label}
                        className={`${panel} p-4 transition-colors duration-700 motion-reduce:transition-none ${
                          k.live && phase === "toast" ? "!border-emerald-400/30 !bg-emerald-500/[0.06]" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-medium tracking-wide text-lp-ink-2 uppercase">
                            {k.label}
                          </span>
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${k.tile}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                        </div>
                        <p className="mt-1 text-xl font-semibold tracking-tight text-lp-ink tabular-nums">{k.value}</p>
                        <p className={`mt-0.5 text-[11px] ${k.warn ? "text-rose-300" : "text-lp-ink-3"}`}>{k.note}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Statistiques du mois */}
                <div className="grid grid-cols-4 gap-3">
                  {stats.map((s) => (
                    <div key={s.label} className={`${panel} p-4`}>
                      <p className="text-[11px] text-lp-ink-3">{s.label}</p>
                      <p className="mt-1.5 text-lg font-semibold tracking-tight text-lp-ink tabular-nums">{s.value}</p>
                      {s.spark ? <Sparkline /> : <p className="mt-1 text-[11px] text-lp-ink-3">{s.note}</p>}
                    </div>
                  ))}
                </div>

                {/* Tableau de stock */}
                <div className={`${panel} overflow-hidden`}>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <span className="flex w-full max-w-xs items-center gap-2 rounded-md border border-white/[0.08] px-2.5 py-1.5 text-xs text-lp-ink-3">
                      <Search className="h-3.5 w-3.5" />
                      Rechercher un produit…
                    </span>
                    <span className="flex items-center gap-3 text-xs text-lp-ink-3">
                      318 produits
                      <span className="flex items-center gap-1.5 rounded-md border border-white/[0.08] px-2.5 py-1.5 text-lp-ink-2">
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Filtres
                      </span>
                    </span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="border-y border-white/[0.06] bg-white/[0.02] text-[10px] font-semibold tracking-wide text-lp-ink-3 uppercase">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold">Produit</th>
                        <th className="px-3 py-2.5 font-semibold">Dépôt</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Qté</th>
                        <th className="px-3 py-2.5 font-semibold">Niveau</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Prix vente</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Prix achat</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Valeur stock</th>
                        <th className="w-10 px-3 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {ROWS.map((r) => {
                        const touched = r.sku === SALE.sku;
                        const qty = touched && sold ? r.qty - SALE.qty : r.qty;
                        const level = LEVEL[r.level];
                        return (
                          <tr
                            key={r.sku}
                            className={`transition-colors duration-700 motion-reduce:transition-none ${
                              touched && phase === "toast" ? "bg-amber-400/[0.06]" : ""
                            }`}
                          >
                            <td className="px-3 py-2.5">
                              <span className="block font-medium text-lp-ink">{r.name}</span>
                              <span className="block text-[10px] text-lp-ink-3">{r.sku}</span>
                            </td>
                            <td className="px-3 py-2.5 text-lp-ink-2">{r.depot}</td>
                            <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-lp-ink">{qty}</td>
                            <td className="px-3 py-2.5">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${level.className}`}
                              >
                                {level.label}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-lp-ink-2">
                              {formatNumber(r.sell)} FCFA
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-lp-ink-3">
                              {formatNumber(r.buy)} FCFA
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium tabular-nums text-lp-ink">
                              {formatNumber(qty * r.buy)} FCFA
                            </td>
                            <td className="px-3 py-2.5 text-lp-ink-3">
                              <Eye className="h-3.5 w-3.5" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-lp-ink-3">Données d&apos;exemple</p>
    </figure>
  );
}
