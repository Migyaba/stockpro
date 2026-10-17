import { container } from "./styles";
import { Accent, Reveal, SectionHeading } from "./ui";

const ITEMS = [
  {
    title: "Un stock juste",
    desc: "Chaque vente, réception ou transfert met à jour la quantité du dépôt concerné. Plus besoin de recompter pour savoir ce qui reste.",
  },
  {
    title: "Des alertes à temps",
    desc: "Un seuil minimum par produit. Les articles faibles ou épuisés remontent avant que le client ne les demande.",
  },
  {
    title: "Tout est tracé",
    desc: "Mouvements de stock et journal d'audit : vous savez qui a vendu, reçu, transféré ou annulé, et quand.",
  },
];

export function HighlightsSection() {
  return (
    <section id="fonctionnalites" className="relative isolate scroll-mt-24 py-24 md:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(45%_55%_at_50%_55%,rgb(67_56_202/0.22),transparent_70%)]"
      />
      <div className={container}>
        <SectionHeading badge="En bref">
          Fini le <Accent>cahier de stock</Accent>
        </SectionHeading>

        <ul className="mt-16 grid grid-cols-1 gap-10 md:mt-20 md:grid-cols-3 md:gap-8">
          {ITEMS.map((item, i) => (
            <Reveal as="li" key={item.title} delay={i * 120} className="relative pl-8">
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/[0.04] via-white/15 to-white/[0.04]"
              />
              <span
                aria-hidden
                className={`absolute top-6 left-0 h-12 w-px ${i === 0 ? "bg-lp-brand-ink" : "bg-lp-brand/60"}`}
              />
              <h3 className="text-2xl font-medium tracking-[-0.01em] text-lp-ink [font-family:var(--font-lp-display)]">
                {item.title}
              </h3>
              <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed text-lp-ink-2">{item.desc}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
