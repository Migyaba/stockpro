import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { HeroDashboard } from "./HeroDashboard";
import { ModulesMarquee } from "./ModulesMarquee";
import { SIGNUP_LABEL, buttonPrimary, buttonSecondary, container } from "./styles";
import { Accent, ButtonChip } from "./ui";

function Stagger({ i, className, children }: { i: number; className?: string; children: React.ReactNode }) {
  return (
    <div className={`lp-rise ${className ?? ""}`} style={{ "--lp-i": i } as React.CSSProperties}>
      {children}
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden pt-32 sm:pt-40">
      {/* Halo indigo : discret en haut, il monte derrière le tableau de bord. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_40%_at_50%_0%,rgb(79_70_229/0.18),transparent_70%),linear-gradient(180deg,transparent_35%,rgb(49_46_129/0.55)_72%,rgb(67_56_202/0.75)_100%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-lp-page" />

      <div className={`${container} text-center`}>
        <Stagger i={0}>
          <h1 className="mx-auto max-w-4xl text-[2.6rem] leading-[1.05] font-medium tracking-[-0.03em] text-lp-ink text-balance sm:text-6xl lg:text-7xl">
            Votre stock à jour, dans <Accent>chaque boutique.</Accent>
          </h1>
        </Stagger>
        <Stagger i={1}>
          <p className="mx-auto mt-6 max-w-[54ch] text-base leading-relaxed text-lp-ink-2 sm:text-lg">
            Ventes, achats, transferts et inventaires au même endroit. StockPro tient le stock de chaque dépôt à jour,
            en FCFA, sur téléphone comme sur ordinateur.
          </p>
        </Stagger>
        <Stagger i={2} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className={buttonPrimary}>
            <span>{SIGNUP_LABEL}</span>
            <ButtonChip />
          </Link>
          <a href="#fonctionnement" className={buttonSecondary}>
            <span>Voir comment ça marche</span>
            <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" aria-hidden />
          </a>
        </Stagger>
        <Stagger i={3}>
          <p className="mt-6 text-sm text-lp-ink-3">
            Sans carte bancaire. Paiement par Mobile Money.
          </p>
        </Stagger>
      </div>

      <Stagger i={4} className={`${container} mt-28`}>
        <HeroDashboard />
      </Stagger>

      <div className="mt-16 pb-16 sm:mt-20 sm:pb-20">
        <ModulesMarquee />
      </div>
    </section>
  );
}
