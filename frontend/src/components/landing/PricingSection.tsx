"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, MessageCircle } from "lucide-react";
import { SIGNUP_LABEL, WHATSAPP_URL, buttonPrimary, buttonSecondary, container } from "./styles";
import { Accent, ButtonChip, Reveal, SectionHeading } from "./ui";

// Tarifs par défaut de PlatformSubscriptionConfig (modifiables dans l'admin
// Django) : penser à mettre cette section à jour s'ils changent.
const PERIODS = {
  monthly: { label: "Mensuel", price: "5 000", period: "FCFA / mois", note: "Sans engagement, renouvelable chaque mois." },
  quarterly: {
    label: "Trimestriel",
    price: "12 500",
    period: "FCFA / trimestre",
    note: "Soit environ 4 170 FCFA par mois, 17 % d'économie.",
  },
} as const;

type Period = keyof typeof PERIODS;

const INCLUDED = [
  "Dépôts et boutiques",
  "Membres de l'équipe et rôles",
  "Produits, variantes et codes-barres",
  "Ventes, achats et transferts",
  "Alertes de stock et notifications",
  "Inventaires à l'aveugle",
  "Plafonds de remise et journal d'audit",
  "Rapports et exports CSV",
];

export function PricingSection() {
  const [period, setPeriod] = useState<Period>("monthly");
  const plan = PERIODS[period];

  return (
    <section id="tarifs" className="relative isolate scroll-mt-24 py-20 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-[radial-gradient(50%_60%_at_50%_100%,rgb(67_56_202/0.25),transparent_70%)]"
      />
      <div className={container}>
        <SectionHeading badge="Tarifs" intro="Toutes les fonctionnalités, quelle que soit la formule. Commencez par 7 jours d'essai gratuit.">
          Un prix <Accent>simple, en FCFA</Accent>
        </SectionHeading>

        <Reveal delay={200} className="mt-10 flex justify-center">
          <div
            role="group"
            aria-label="Période de facturation"
            className="relative grid grid-cols-2 rounded-full bg-lp-brand p-1.5 shadow-lp-glow"
          >
            <span
              aria-hidden
              className={`absolute inset-y-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-full bg-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                period === "quarterly" ? "translate-x-full" : ""
              }`}
            />
            {(Object.keys(PERIODS) as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
                className={`relative rounded-full px-5 py-2 text-sm font-medium outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-white sm:px-6 ${
                  period === p ? "text-lp-brand" : "text-white/85 hover:text-white"
                }`}
              >
                {PERIODS[p].label}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-5 lg:grid-cols-5">
          <Reveal
            as="article"
            className="relative overflow-hidden rounded-3xl border border-lp-brand/60 bg-[linear-gradient(170deg,#211d5c_0%,#16143a_45%,#111118_100%)] p-7 sm:p-10 lg:col-span-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-2xl font-medium text-lp-ink [font-family:var(--font-lp-display)]">StockPro</h3>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-lp-ink">
                7 jours d&apos;essai gratuit
              </span>
            </div>
            <p className="mt-8 flex flex-wrap items-baseline gap-x-3" aria-live="polite">
              <span key={period} className="lp-swap text-5xl font-semibold tracking-tight tabular-nums text-lp-ink sm:text-6xl">
                {plan.price}
              </span>
              <span className="text-sm text-lp-ink-2 uppercase">{plan.period}</span>
            </p>
            <p className="mt-3 text-sm text-lp-ink-2">{plan.note}</p>

            <Link href="/register" className={`${buttonPrimary} mt-8 w-full justify-between`}>
              <span>{SIGNUP_LABEL}</span>
              <ButtonChip />
            </Link>

            <ul className="mt-9 grid grid-cols-1 gap-3 border-t border-white/10 pt-8 sm:grid-cols-2">
              {INCLUDED.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-lp-ink-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-lp-brand-ink" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal
            as="article"
            delay={120}
            className="flex flex-col rounded-3xl border border-white/[0.07] bg-lp-surface/80 p-7 sm:p-10 lg:col-span-2"
          >
            <h3 className="text-2xl font-medium text-lp-ink [font-family:var(--font-lp-display)]">Réseau de boutiques</h3>
            <p className="mt-4 text-[15px] leading-relaxed text-lp-ink-2">
              Plusieurs organisations ou un grand réseau de points de vente&nbsp;? Nous pouvons convenir d&apos;un tarif adapté.
            </p>
            <div className="mt-8 rounded-2xl bg-white/[0.04] p-5 text-sm leading-relaxed text-lp-ink-2 ring-1 ring-inset ring-white/[0.06]">
              Paiement par Mobile Money depuis l&apos;application&nbsp;: MTN, Moov, Wave ou Orange Money. L&apos;abonnement
              est activé dès la confirmation.
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonSecondary} mt-8 w-full lg:mt-auto`}
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              <span>Écrivez-nous sur WhatsApp</span>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
