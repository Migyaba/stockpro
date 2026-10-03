import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { ProblemSolutionSection } from "@/components/landing/ProblemSolutionSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { MultiDepotShowcase } from "@/components/landing/MultiDepotShowcase";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "STOCKPRO — Logiciel de Gestion Commerciale & Multi-Dépôts en Afrique (FCFA)",
  description:
    "Gérez vos entrepôts, vos boutiques, votre caisse POS et votre trésorerie sans aucune perte. La solution SaaS B2B de référence pour grossistes et commerçants en Afrique francophone.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500 selection:text-white">
      <LandingNavbar />
      <main>
        <HeroSection />
        <StatsSection />
        <ProblemSolutionSection />
        <FeaturesSection />
        <MultiDepotShowcase />
        <PricingSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
