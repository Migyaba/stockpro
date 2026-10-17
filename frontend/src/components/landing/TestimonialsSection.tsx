import { container, sectionTitle } from "./styles";

// Uniquement de vrais clients, avec leur accord. Tant que la liste est vide,
// la section ne s'affiche pas.
const TESTIMONIALS: { quote: string; name: string; business: string; city: string }[] = [];

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TestimonialsSection() {
  if (TESTIMONIALS.length === 0) return null;

  return (
    <section className="py-20 md:py-28">
      <div className={container}>
        <h2 className={`${sectionTitle} max-w-[22ch]`}>Ils tiennent leur stock avec StockPro</h2>
        <ul className="mt-10 grid grid-cols-1 gap-x-10 gap-y-12 md:mt-12 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <li key={t.name}>
              <figure className="flex h-full flex-col border-t border-lp-ink/80 pt-6">
                <blockquote className="text-lg leading-relaxed text-lp-ink text-pretty">
                  &laquo;&nbsp;{t.quote}&nbsp;&raquo;
                </blockquote>
                <figcaption className="mt-auto flex items-center gap-3 pt-8">
                  <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lp-mark text-xs font-semibold text-lp-on-deep"
                  >
                    {initials(t.name)}
                  </span>
                  <span className="text-sm">
                    <span className="block font-medium text-lp-ink">{t.name}</span>
                    <span className="block text-lp-ink-3">
                      {t.business}, {t.city}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
