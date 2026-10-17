import Link from "next/link";
import { CircleCheck, MessageCircle } from "lucide-react";
import { SIGNUP_LABEL, WHATSAPP_URL, buttonPrimary, container } from "./styles";
import { Accent, ButtonChip, Reveal } from "./ui";

const POINTS = ["Aucune carte bancaire", "7 jours, toutes les fonctionnalités"];

export function CtaSection() {
  return (
    <section className="relative isolate overflow-hidden border-y border-white/[0.06] bg-lp-deep py-20 md:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_120%_at_85%_50%,rgb(79_70_229/0.3),transparent_70%)]"
      />
      <div className={`${container} grid grid-cols-1 items-center gap-10 lg:grid-cols-12`}>
        <Reveal from="left" className="text-center lg:col-span-7 lg:text-left">
          <h2 className="text-[2.4rem] leading-[1.05] font-medium tracking-[-0.02em] text-lp-on-deep sm:text-5xl lg:text-6xl">
            Commencez vos 7&nbsp;jours <br className="hidden sm:block" />
            d&apos;<Accent>essai gratuit</Accent>
          </h2>
          <ul className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            {POINTS.map((p) => (
              <li
                key={p}
                className="flex items-center gap-2.5 rounded-full bg-white/[0.06] py-1.5 pr-4 pl-1.5 text-sm text-lp-on-deep ring-1 ring-inset ring-white/[0.08]"
              >
                <CircleCheck className="h-6 w-6 fill-lp-brand text-white" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={150} className="flex flex-col items-center gap-6 lg:col-span-5 lg:items-end">
          <Link href="/register" className={buttonPrimary}>
            <span>{SIGNUP_LABEL}</span>
            <ButtonChip />
          </Link>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg text-sm text-lp-on-deep-2 outline-none transition-colors hover:text-lp-on-deep focus-visible:ring-2 focus-visible:ring-lp-brand-ink"
          >
            <MessageCircle className="h-6 w-6 text-lp-brand-on-deep" aria-hidden />
            <span className="text-left leading-snug whitespace-nowrap">
              Une question avant de commencer&nbsp;?
              <span className="block font-medium text-lp-on-deep">Écrivez-nous sur WhatsApp</span>
            </span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
