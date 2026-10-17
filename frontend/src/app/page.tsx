import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { HeroSection } from "@/components/landing/HeroSection";
import { HighlightsSection } from "@/components/landing/HighlightsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SegmentsSection } from "@/components/landing/SegmentsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

const geist = Geist({ subsets: ["latin"], variable: "--font-lp-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-lp-mono", display: "swap" });
// Titres larges et mots d'accent en italique, d'après la référence de design.
// Fichiers servis par le projet (sous-ensemble latin, polices variables) :
// le chargeur Google de Turbopack échouait sur EB Garamond en CI.
const display = localFont({
  src: "./fonts/syne-latin.woff2",
  weight: "400 800",
  variable: "--font-lp-display",
  display: "swap",
});
const accent = localFont({
  src: "./fonts/eb-garamond-italic-latin.woff2",
  weight: "400 800",
  style: "italic",
  variable: "--font-lp-accent",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    absolute: "StockPro | Gestion de stock et de boutiques en FCFA",
  },
  description:
    "Ventes, achats, transferts, alertes et inventaires pour vos boutiques et entrepôts. Essai gratuit de 7 jours, puis 5 000 FCFA par mois.",
};

export default function HomePage() {
  return (
    <div
      className={`landing ${geist.variable} ${geistMono.variable} ${display.variable} ${accent.variable} min-h-[100dvh] overflow-x-clip bg-lp-page text-lp-ink antialiased selection:bg-lp-brand selection:text-white [font-family:var(--font-lp-sans)] [&_.font-mono]:[font-family:var(--font-lp-mono)] [&_h1]:[font-family:var(--font-lp-display)] [&_h2]:[font-family:var(--font-lp-display)]`}
    >
      <LandingReveal />
      <LandingNavbar />
      <main>
        <HeroSection />
        <HighlightsSection />
        <FeaturesSection />
        <SegmentsSection />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
