import { ArrowRightLeft, Bell } from "lucide-react";
import { container } from "./styles";
import { Accent, Reveal, SectionHeading } from "./ui";

// Données d'exemple pour les mini-interfaces.
const ALERTS = [
  { name: "Sucre en morceaux 1 kg", depot: "Boutique Cadjèhoun", qty: "0 / 25", label: "Rupture", tone: "bg-rose-500/10 text-rose-300" },
  { name: "Huile végétale 5 L", depot: "Boutique Dantokpa", qty: "6 / 20", label: "Faible", tone: "bg-amber-500/10 text-amber-300" },
  { name: "Lait en poudre 400 g", depot: "Dépôt Akpakpa", qty: "11 / 40", label: "Faible", tone: "bg-amber-500/10 text-amber-300" },
];

const DEPOTS = [
  { name: "Dépôt Akpakpa", qty: 140 },
  { name: "Boutique Dantokpa", qty: 52 },
  { name: "Boutique Cadjèhoun", qty: 26 },
];

// Tout ce qui est inclus en plus : des fonctionnalités réelles, rien d'autre.
const PILLS = [
  { label: "Inventaires à l'aveugle", r: -6, x: "4%", y: "14%" },
  { label: "Réceptions partielles", r: 4, x: "38%", y: "11%" },
  { label: "Plafond de remise", r: -3, x: "66%", y: "18%" },
  { label: "Prix d'achat masqués", r: 6, x: "10%", y: "32%" },
  { label: "Journal d'audit", r: -8, x: "48%", y: "31%" },
  { label: "Codes-barres", r: 3, x: "74%", y: "37%" },
  { label: "Variantes", r: -4, x: "2%", y: "52%" },
  { label: "Exports CSV", r: 7, x: "30%", y: "51%" },
  { label: "Clients", r: -2, x: "58%", y: "54%" },
  { label: "Fournisseurs", r: 5, x: "16%", y: "70%" },
  { label: "Notifications", r: -6, x: "46%", y: "72%" },
  { label: "Rapports", r: 3, x: "72%", y: "69%" },
];

const cardBase = "relative isolate overflow-hidden rounded-3xl border border-white/[0.07]";
const miniPanel = "rounded-2xl border border-white/[0.08] bg-[#14141c]/90 shadow-[0_24px_48px_-24px_rgb(0_0_0/0.9)]";

function CardText({ title, children, align = "left" }: { title: string; children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <div className={align === "right" ? "md:text-right" : ""}>
      <h3 className="text-2xl font-medium tracking-[-0.01em] text-lp-ink sm:text-3xl [font-family:var(--font-lp-display)]">
        {title}
      </h3>
      <p className={`mt-4 max-w-[46ch] text-[15px] leading-relaxed text-lp-ink-2 ${align === "right" ? "md:ml-auto" : ""}`}>
        {children}
      </p>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section id="pourquoi" className="scroll-mt-24 pb-12 md:pb-16">
      <div className={container}>
        <SectionHeading badge="Pourquoi StockPro">
          Gardez la main sur <Accent>chaque article</Accent>
        </SectionHeading>

        <div className="mt-14 grid grid-cols-1 gap-5 md:mt-20 md:grid-cols-2 md:gap-6">
          {/* Alertes */}
          <Reveal
            as="article"
            className={`${cardBase} flex flex-col bg-[linear-gradient(160deg,#16151f_0%,#121124_55%,#1d1a4a_100%)] p-7 sm:p-10`}
          >
            <CardText title="Les ruptures, vues à temps">
              Fixez un seuil par produit. StockPro vous prévient dans vos notifications dès qu&apos;un article passe en
              dessous.
            </CardText>
            <div aria-hidden className={`${miniPanel} mt-10 -mb-14 p-4 sm:-mr-14 sm:-mb-16 sm:p-5`}>
              <div className="flex items-center justify-between pb-3">
                <span className="text-sm font-semibold text-lp-ink">Alertes de stock</span>
                <span className="relative text-lp-ink-3">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-400" />
                </span>
              </div>
              <ul className="divide-y divide-white/[0.06] text-sm">
                {ALERTS.map((a) => (
                  <li key={a.name} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate text-lp-ink">{a.name}</span>
                      <span className="block truncate text-xs text-lp-ink-3">{a.depot}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-xs tabular-nums text-lp-ink-2">{a.qty}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${a.tone}`}>{a.label}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Multi-dépôts */}
          <Reveal
            as="article"
            delay={120}
            className={`${cardBase} flex flex-col-reverse bg-[linear-gradient(200deg,#2a2580_0%,#1c1858_40%,#13122a_100%)] p-7 sm:p-10 md:flex-col`}
          >
            <div aria-hidden className={`${miniPanel} mt-10 p-4 sm:-mt-16 sm:-mr-14 sm:mb-10 sm:p-5 md:mt-0`}>
              <p className="text-sm font-semibold text-lp-ink">Riz parfumé 25 kg</p>
              <p className="text-xs text-lp-ink-3">Tous les dépôts · 218 sacs</p>
              <ul className="mt-4 space-y-3 text-sm">
                {DEPOTS.map((d) => (
                  <li key={d.name} className="grid grid-cols-[minmax(0,8.5rem)_1fr_auto] items-center gap-3">
                    <span className="truncate text-lp-ink-2">{d.name}</span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <span className="block h-full rounded-full bg-indigo-400" style={{ width: `${(d.qty / 140) * 100}%` }} />
                    </span>
                    <span className="w-8 text-right text-xs tabular-nums text-lp-ink">{d.qty}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3 text-xs text-lp-ink-2">
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-300">Terminé</span>
                Akpakpa <ArrowRightLeft className="h-3 w-3 text-lp-ink-3" /> Dantokpa · 40 sacs
              </div>
            </div>
            <div className="md:mt-auto">
              <CardText title="Plusieurs dépôts, un seul stock" align="right">
                Entrepôt et boutiques ont chacun leurs quantités. Transférez la marchandise, le stock suit des deux
                côtés.
              </CardText>
            </div>
          </Reveal>

          {/* Tout le reste */}
          <Reveal
            as="article"
            delay={80}
            className={`${cardBase} grid grid-cols-1 items-center gap-10 bg-[linear-gradient(90deg,#121119_0%,#17153a_100%)] p-7 sm:p-10 md:col-span-2 md:grid-cols-2 md:items-stretch md:p-0`}
          >
            <div className="md:p-12 lg:p-16">
              <CardText title="Et tout ce qu'il faut autour">
                Rôles et prix d&apos;achat masqués, inventaires sans biais, réceptions en plusieurs fois, rapports
                exportables. Inclus dans chaque abonnement.
              </CardText>
            </div>
            <div
              aria-hidden
              className="relative flex flex-wrap content-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#151436] bg-[linear-gradient(rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.035)_1px,transparent_1px)] bg-[size:40px_40px] px-4 py-8 lg:block lg:h-full lg:min-h-96 md:rounded-none md:rounded-r-3xl md:border-0 md:border-l lg:p-0"
            >
              {PILLS.map((p) => (
                <span
                  key={p.label}
                  className="rounded-full bg-lp-brand px-4 py-2 text-sm font-medium whitespace-nowrap text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_12px_24px_-10px_rgb(0_0_0/0.8)] transition-transform duration-300 [rotate:calc(var(--r)*0.5)] hover:-translate-y-1 motion-reduce:transition-none lg:absolute lg:top-(--y) lg:left-(--x) lg:[rotate:var(--r)]"
                  style={{ "--x": p.x, "--y": p.y, "--r": `${p.r}deg` } as React.CSSProperties}
                >
                  {p.label}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
