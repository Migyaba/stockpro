import { Sparkle } from "lucide-react";

// Uniquement des modules qui existent dans l'application.
const MODULES = [
  "Ventes",
  "Achats",
  "Transferts",
  "Inventaires",
  "Alertes de stock",
  "Rapports",
  "Clients",
  "Fournisseurs",
  "Codes-barres",
  "Journal d'audit",
];

function Row({ hidden }: { hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center">
      {MODULES.map((m) => (
        <li key={m} className="flex items-center">
          <span className="px-6 text-2xl font-medium tracking-[-0.01em] whitespace-nowrap text-lp-ink/85 [font-family:var(--font-lp-display)] sm:px-8 sm:text-3xl">
            {m}
          </span>
          <Sparkle className="h-5 w-5 shrink-0 fill-current text-lp-brand" aria-hidden />
        </li>
      ))}
    </ul>
  );
}

// Le seul défilement continu de la page. À l'arrêt (et en liste à plat
// lisible) sous prefers-reduced-motion.
export function ModulesMarquee() {
  return (
    <div className="lp-marquee relative overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
      <p className="sr-only">Modules inclus : {MODULES.join(", ")}.</p>
      <div className="lp-marquee-track flex w-max">
        <Row hidden />
        <Row hidden />
      </div>
    </div>
  );
}
