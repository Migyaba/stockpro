import { container } from "./styles";
import { Accent, Reveal, SectionHeading } from "./ui";

const STEPS = [
  {
    title: "Créez votre organisation",
    desc: "Un compte, le nom de votre commerce, et l'essai de 7 jours démarre. Aucun paiement demandé.",
  },
  {
    title: "Ajoutez dépôts et produits",
    desc: "Déclarez vos boutiques et entrepôts, vos articles et leurs seuils, puis invitez votre équipe.",
  },
  {
    title: "Vendez, achetez, suivez",
    desc: "Chaque opération met le stock à jour. Le tableau de bord et les alertes font le reste.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="fonctionnement" className="scroll-mt-24 py-20 md:py-28">
      <div className={container}>
        <SectionHeading badge="Comment ça marche">
          Opérationnel <Accent>le jour même</Accent>
        </SectionHeading>

        <div className="relative mt-16 md:mt-20">
          <span
            aria-hidden
            className="absolute top-6 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-lp-brand/0 via-lp-brand/70 to-lp-brand/0 md:block"
          />
          <span
            aria-hidden
            className="absolute top-6 bottom-6 left-6 w-px bg-gradient-to-b from-lp-brand/70 to-lp-brand/0 md:hidden"
          />
          <ol className="relative grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
            {STEPS.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 140} className="relative flex gap-6 md:block md:text-center">
                <span
                  aria-hidden
                  className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lp-page text-base font-semibold tabular-nums text-white ring-1 ring-lp-brand/60 md:mx-auto"
                >
                  <span className="absolute inset-1 rounded-full bg-lp-brand shadow-lp-glow" />
                  <span className="relative">{i + 1}</span>
                </span>
                <div className="md:mt-7">
                  <h3 className="text-xl font-medium tracking-[-0.01em] text-lp-ink [font-family:var(--font-lp-display)]">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-[36ch] text-[15px] leading-relaxed text-lp-ink-2 md:mx-auto">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
