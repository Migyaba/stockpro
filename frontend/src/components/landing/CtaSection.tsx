"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageCircle, Sparkles } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="relative rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/80 via-zinc-900/90 to-zinc-950 p-8 sm:p-12 lg:p-16 text-center shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Background decorative glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-indigo-500/20 blur-[100px]"
          />

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Passez à la vitesse supérieure dès aujourd&apos;hui</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Prenez le contrôle absolu de votre commerce et stoppez les pertes.
            </h2>

            <p className="mt-6 text-base sm:text-lg text-zinc-300 max-w-2xl leading-relaxed">
              Créez votre organisation en moins de 2 minutes. Vos employés encaissent, vos stocks s&apos;ajustent en direct, et vous pilotez votre rentabilité depuis votre canapé.
            </p>

            {/* Tunnel Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Link
                href="/register"
                className="flex items-center justify-center gap-3 w-full sm:w-auto rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-600/40 hover:shadow-indigo-600/60 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Démarrer l&apos;essai gratuit 14 jours</span>
                <ArrowRight className="h-5 w-5" />
              </Link>

              <a
                href="https://wa.me/22900000000?text=Bonjour%20StockPro,%20je%20souhaite%20une%20d%C3%A9monstration%20pour%20mon%20commerce"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-6 py-4 text-base font-semibold text-emerald-300 hover:bg-emerald-900/40 hover:text-white transition-all shadow-md"
              >
                <MessageCircle className="h-5 w-5 text-emerald-400" />
                <span>Parler à un conseiller WhatsApp</span>
              </a>
            </div>

            {/* Trust points */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Aucune carte bancaire requise</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Configuration instantanée</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Support réactif 7j/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
