import { Sparkle } from "lucide-react";
import { sectionTitle } from "./styles";

// Apparition au défilement. Le masquage n'est actif qu'une fois LandingReveal
// monté (data-reveal-ready), et jamais sous prefers-reduced-motion.
export function Reveal({
  as: Tag = "div",
  delay = 0,
  from,
  className,
  children,
}: {
  as?: "div" | "li" | "article" | "section";
  delay?: number;
  from?: "left";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag
      data-reveal={from ?? ""}
      className={className}
      style={delay ? ({ "--lp-d": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}

// La puce ronde à l'intérieur des boutons principaux.
export function ButtonChip() {
  return (
    <span
      aria-hidden
      className="flex h-8 w-12 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:rotate-90 motion-reduce:transition-none"
    >
      <Sparkle className="h-3.5 w-3.5 fill-current" />
    </span>
  );
}

export function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-lp-brand-soft px-4 py-1.5 text-sm text-lp-ink ring-1 ring-inset ring-lp-brand/25">
      {children}
      <Sparkle className="h-3 w-3 fill-current text-lp-brand-ink" aria-hidden />
    </span>
  );
}

// Mot ou groupe de mots mis en avant dans un titre : italique de la police
// d'accent, comme sur la référence.
export function Accent({ children }: { children: React.ReactNode }) {
  return <em className="pr-[0.06em] font-normal italic [font-family:var(--font-lp-accent)]">{children}</em>;
}

export function SectionHeading({
  badge,
  children,
  intro,
  align = "center",
}: {
  badge?: string;
  children: React.ReactNode;
  intro?: React.ReactNode;
  align?: "center" | "left";
}) {
  const centered = align === "center";
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {badge && (
        <Reveal>
          <SectionBadge>{badge}</SectionBadge>
        </Reveal>
      )}
      <Reveal delay={80}>
        <h2 className={`${sectionTitle} ${badge ? "mt-5" : ""}`}>{children}</h2>
      </Reveal>
      {intro && (
        <Reveal delay={160}>
          <p
            className={`mt-5 text-base sm:text-lg leading-relaxed text-lp-ink-2 ${centered ? "mx-auto max-w-[56ch]" : "max-w-[56ch]"}`}
          >
            {intro}
          </p>
        </Reveal>
      )}
    </div>
  );
}
