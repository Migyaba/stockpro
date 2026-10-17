"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Check, ArrowRightLeft } from "lucide-react";
import { SIGNUP_LABEL, WHATSAPP_URL, buttonPrimary, buttonSecondary, container } from "./styles";
import { Accent, ButtonChip, Reveal, SectionHeading } from "./ui";

type Visual = "sale" | "team" | "purchase" | "network";

// Chaque point doit correspondre à une fonctionnalité qui existe vraiment.
const SEGMENTS: { id: string; label: string; title: string; pitch: string; points: string[]; visual: Visual }[] = [
  {
    id: "boutique",
    label: "Petite boutique",
    title: "Vendez, le stock suit tout seul.",
    pitch:
      "Plus besoin du cahier : chaque vente retire les articles du stock, et vous voyez ce qui reste depuis votre téléphone.",
    points: [
      "Une vente enregistrée, le stock mis à jour",
      "Une alerte quand un article passe sous son seuil",
      "Sur téléphone comme sur ordinateur, rien à installer",
    ],
    visual: "sale",
  },
  {
    id: "grande-boutique",
    label: "Grande boutique",
    title: "Votre équipe vend, vous gardez la main.",
    pitch: "Plusieurs caissiers, beaucoup d'articles : chacun a son rôle, et chaque opération est tracée.",
    points: [
      "Les caissiers ne voient pas vos prix d'achat",
      "Un plafond de remise fixé pour chaque membre",
      "Variantes et codes-barres par article",
      "Un journal d'audit : qui a fait quoi, et quand",
    ],
    visual: "team",
  },
  {
    id: "grossiste",
    label: "Grossiste",
    title: "Vos achats suivis au carton près.",
    pitch:
      "Passez vos commandes fournisseurs, réceptionnez-les en plusieurs fois et comptez vos dépôts sans fausser le résultat.",
    points: [
      "Commandes fournisseurs et réceptions partielles",
      "Inventaires à l'aveugle avec revue des écarts",
      "Rapports et exports CSV sur la période choisie",
    ],
    visual: "purchase",
  },
  {
    id: "chaine",
    label: "Chaîne multi‑boutiques",
    title: "Toutes vos boutiques sur un seul écran.",
    pitch:
      "Chaque boutique et chaque entrepôt a son propre stock. Transférez la marchandise et suivez tout le réseau, où que vous soyez.",
    points: [
      "Stock par dépôt et vue d'ensemble pour le gérant",
      "Transferts entre boutiques et entrepôts",
      "Chaque membre limité aux dépôts où il travaille",
    ],
    visual: "network",
  },
];

const frame =
  "rounded-[28px] bg-[linear-gradient(160deg,rgb(79_70_229/0.25),rgb(255_255_255/0.02)_45%)] p-2 sm:p-3 ring-1 ring-inset ring-white/[0.08]";
const panel = "overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#111118] shadow-lp";
const badge = "inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium";

function PanelHeader({ title, sub, status }: { title: string; sub: string; status?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-lp-line px-4 py-3.5 sm:px-5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-lp-ink">{title}</p>
        <p className="truncate text-xs text-lp-ink-3">{sub}</p>
      </div>
      {status}
    </div>
  );
}

function SaleVisual() {
  const lines = [
    { name: "Savon de ménage 400 g", qty: 4, total: "1 600" },
    { name: "Sucre en morceaux 1 kg", qty: 2, total: "1 400" },
    { name: "Concentré de tomate 70 g", qty: 6, total: "900" },
  ];
  return (
    <div className={panel}>
      <PanelHeader
        title="Vente V-0231"
        sub="Boutique Cadjèhoun · aujourd'hui, 10:42"
        status={<span className={`${badge} bg-lp-ok/10 text-lp-ok`}>Payée</span>}
      />
      <ul className="divide-y divide-lp-line px-4 text-sm sm:px-5">
        {lines.map((l) => (
          <li key={l.name} className="flex items-center justify-between gap-3 py-2.5">
            <span className="min-w-0 truncate text-lp-ink">
              <span className="tabular-nums text-lp-ink-3">{l.qty} ×</span> {l.name}
            </span>
            <span className="tabular-nums text-lp-ink-2 whitespace-nowrap">{l.total} FCFA</span>
          </li>
        ))}
      </ul>
      <div className="flex items-baseline justify-between border-t border-lp-line px-4 py-3 sm:px-5">
        <span className="text-sm text-lp-ink-2">Total</span>
        <span className="text-xl font-semibold tracking-tight tabular-nums text-lp-ink">
          3 900 <span className="text-xs font-normal text-lp-ink-3">FCFA</span>
        </span>
      </div>
      <div className="border-t border-lp-line bg-lp-page px-4 py-3.5 sm:px-5">
        <p className="text-xs font-medium text-lp-ink-2">Stock mis à jour</p>
        <ul className="mt-2 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-3">
          {[
            ["Savon 400 g", "24", "20"],
            ["Sucre 1 kg", "15", "13"],
            ["Tomate 70 g", "60", "54"],
          ].map(([n, a, b]) => (
            <li key={n} className="flex justify-between gap-2 sm:block">
              <span className="text-lp-ink-3">{n}</span>
              <span className="tabular-nums text-lp-ink sm:mt-0.5 sm:block">
                {a} → {b}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TeamVisual() {
  const members = [
    { initials: "AH", name: "Afi Houngbo", role: "Gestionnaire", rule: "Remise max. 10 %", tone: "ok" },
    { initials: "KA", name: "Koffi Agbo", role: "Caissier / Opérateur", rule: "Prix d'achat masqués", tone: "muted" },
    { initials: "SD", name: "Sèna Dossou", role: "Caissier / Opérateur", rule: "Sans remise", tone: "muted" },
  ];
  return (
    <div className={panel}>
      <PanelHeader title="Membres de l'équipe" sub="Boutique Dantokpa · 3 membres" />
      <ul className="divide-y divide-lp-line px-4 text-sm sm:px-5">
        {members.map((m) => (
          <li key={m.name} className="flex items-center gap-3 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lp-surface-2 text-xs font-semibold text-lp-ink-2">
              {m.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-lp-ink">{m.name}</span>
              <span className="block truncate text-xs text-lp-ink-3">{m.role}</span>
            </span>
            <span
              className={`${badge} ${m.tone === "ok" ? "bg-lp-brand-soft text-lp-brand-ink" : "bg-lp-surface-2 text-lp-ink-2"}`}
            >
              {m.rule}
            </span>
          </li>
        ))}
      </ul>
      <div className="border-t border-lp-line bg-lp-page px-4 py-3.5 sm:px-5">
        <p className="text-xs font-medium text-lp-ink-2">Journal d&apos;audit</p>
        <ul className="mt-2 space-y-1.5 text-xs text-lp-ink-2">
          <li className="flex gap-3">
            <span className="tabular-nums text-lp-ink-3">14:32</span>
            <span className="min-w-0 truncate">Afi Houngbo a validé la réception CF-0142</span>
          </li>
          <li className="flex gap-3">
            <span className="tabular-nums text-lp-ink-3">11:05</span>
            <span className="min-w-0 truncate">Koffi Agbo a enregistré la vente V-0228</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function PurchaseVisual() {
  const lines = [
    { name: "Riz parfumé 25 kg", got: 80, of: 80, unit: "sacs" },
    { name: "Huile végétale 5 L", got: 30, of: 50, unit: "cartons" },
    { name: "Sucre 50 kg", got: 0, of: 20, unit: "sacs" },
  ];
  return (
    <div className={panel}>
      <PanelHeader
        title="Commande fournisseur CF-0142"
        sub="Dépôt Akpakpa · 3 lignes"
        status={<span className={`${badge} bg-lp-warn/10 text-lp-warn`}>Partiellement reçue</span>}
      />
      <ul className="space-y-4 px-4 py-4 text-sm sm:px-5">
        {lines.map((l) => (
          <li key={l.name}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-lp-ink">{l.name}</span>
              <span className="text-xs tabular-nums text-lp-ink-2 whitespace-nowrap">
                <span className="text-lp-ink">{l.got}</span> / {l.of} {l.unit}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-lp-surface-2">
              <div className="h-full rounded-full bg-lp-brand" style={{ width: `${(l.got / l.of) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-3 border-t border-lp-line bg-lp-page px-4 py-3.5 sm:px-5">
        <span className="text-xs text-lp-ink-2">Reste à recevoir : 20 cartons, 20 sacs</span>
        <span className="rounded-lg bg-lp-ink px-3 py-1.5 text-xs font-medium text-lp-page whitespace-nowrap">
          Réceptionner
        </span>
      </div>
    </div>
  );
}

function NetworkVisual() {
  const depots = [
    { name: "Dépôt Akpakpa", qty: 140 },
    { name: "Boutique Dantokpa", qty: 52 },
    { name: "Boutique Cadjèhoun", qty: 26 },
    { name: "Boutique Porto-Novo", qty: 18 },
  ];
  const max = Math.max(...depots.map((d) => d.qty));
  return (
    <div className={panel}>
      <PanelHeader title="Lait en poudre 400 g" sub="Tous les dépôts · 236 cartons" />
      <ul className="space-y-3 px-4 py-4 text-sm sm:px-5">
        {depots.map((d) => (
          <li key={d.name} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3">
            <span className="truncate text-lp-ink">{d.name}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-lp-surface-2">
              <span className="block h-full rounded-full bg-lp-brand" style={{ width: `${(d.qty / max) * 100}%` }} />
            </span>
            <span className="w-10 text-right text-xs tabular-nums text-lp-ink-2">{d.qty}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-lp-line bg-lp-page px-4 py-3.5 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-lp-ink-2">Transfert TR-0087</p>
          <span className={`${badge} bg-lp-ok/10 text-lp-ok`}>Terminé</span>
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-lp-ink">
          <span>Dépôt Akpakpa</span>
          <ArrowRightLeft className="h-3.5 w-3.5 text-lp-ink-3" />
          <span>Boutique Dantokpa</span>
          <span className="text-xs tabular-nums text-lp-ink-3">· 40 cartons</span>
        </p>
      </div>
    </div>
  );
}

const VISUALS: Record<Visual, () => React.JSX.Element> = {
  sale: SaleVisual,
  team: TeamVisual,
  purchase: PurchaseVisual,
  network: NetworkVisual,
};

export function SegmentsSection() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const segment = SEGMENTS[active];
  const Visual = VISUALS[segment.visual];

  const focusTab = (i: number) => {
    const next = (i + SEGMENTS.length) % SEGMENTS.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") focusTab(active + 1);
    else if (e.key === "ArrowLeft") focusTab(active - 1);
    else if (e.key === "Home") focusTab(0);
    else if (e.key === "End") focusTab(SEGMENTS.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <section id="pour-qui" className="relative isolate scroll-mt-24 py-20 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,transparent,rgb(30_27_75/0.45)_50%,transparent)]"
      />
      <div className={container}>
        <SectionHeading
          badge="Pour qui"
          intro="Choisissez votre commerce pour voir ce que StockPro change au quotidien."
        >
          Pensé pour votre <Accent>façon de vendre</Accent>
        </SectionHeading>

        <Reveal delay={200}>
          <div
            role="tablist"
            aria-label="Type de commerce"
            onKeyDown={onKeyDown}
            className="mx-auto mt-10 grid w-fit max-w-full grid-cols-2 gap-1 rounded-[22px] bg-white/[0.05] p-1.5 ring-1 ring-inset ring-white/[0.08] sm:grid-cols-4 sm:rounded-full md:mt-12"
          >
            {SEGMENTS.map((s, i) => {
              const selected = i === active;
              return (
                <button
                  key={s.id}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  id={`segment-tab-${s.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`segment-panel-${s.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(i)}
                  className={`rounded-full px-4 py-2.5 text-sm leading-tight font-medium text-balance outline-none transition-[background-color,color,box-shadow] duration-300 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-lp-brand-ink sm:px-5 sm:whitespace-nowrap ${
                    selected
                      ? "bg-lp-brand text-white shadow-lp-glow"
                      : "text-lp-ink-2 hover:bg-white/[0.05] hover:text-lp-ink"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </Reveal>

        <div
          key={segment.id}
          id={`segment-panel-${segment.id}`}
          role="tabpanel"
          aria-labelledby={`segment-tab-${segment.id}`}
          tabIndex={0}
          className="lp-swap mt-12 grid grid-cols-1 items-center gap-10 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-lp-brand-ink md:mt-16 lg:grid-cols-12 lg:gap-16"
        >
          <div className="lg:col-span-5">
            <h3 className="text-2xl sm:text-[2rem] font-medium tracking-[-0.02em] leading-tight text-lp-ink text-balance [font-family:var(--font-lp-display)]">
              {segment.title}
            </h3>
            <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-lp-ink-2">{segment.pitch}</p>
            <ul className="mt-7 space-y-3">
              {segment.points.map((p) => (
                <li key={p} className="flex gap-3 text-[15px] text-lp-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-lp-brand-ink" aria-hidden />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className={buttonPrimary}>
                <span>{SIGNUP_LABEL}</span>
                <ButtonChip />
              </Link>
              {segment.visual === "network" && (
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={buttonSecondary}>
                  Parler de votre réseau
                </a>
              )}
            </div>
          </div>

          <div className="lg:col-span-7" aria-hidden>
            <div className={frame}>
              <Visual />
              <p className="px-2 pt-2.5 pb-0.5 text-xs text-lp-ink-3 sm:px-1">Données d&apos;exemple</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
