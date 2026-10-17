"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { WHATSAPP_URL, container } from "./styles";
import { Accent, Reveal, SectionHeading } from "./ui";

const FAQS = [
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "Vous créez votre organisation et profitez de toutes les fonctionnalités pendant 7 jours, sans paiement. À la fin de l'essai, vous choisissez la formule mensuelle ou trimestrielle pour continuer.",
  },
  {
    q: "Comment payer l'abonnement ?",
    a: "Depuis les paramètres de votre espace, par Mobile Money : MTN, Moov, Wave ou Orange Money. L'abonnement est activé dès la confirmation du paiement.",
  },
  {
    q: "Mes employés peuvent-ils voir mes prix d'achat ?",
    a: "Non. Le rôle Caissier / Opérateur ne voit ni les prix d'achat ni la valeur du stock. Il ne peut pas non plus accorder de remise ni annuler une vente.",
  },
  {
    q: "Je gère plusieurs boutiques. Comment ça se passe ?",
    a: "Chaque boutique ou entrepôt est un dépôt avec son propre stock. Vous transférez la marchandise d'un dépôt à l'autre, et vous pouvez limiter chaque membre aux dépôts où il travaille.",
  },
  {
    q: "Faut-il installer un logiciel ?",
    a: "Non. StockPro s'utilise dans le navigateur, sur ordinateur comme sur téléphone. Il faut une connexion internet.",
  },
  {
    q: "Puis-je récupérer mes données ?",
    a: "Oui. Ventes, achats, stock, mouvements et inventaires s'exportent en CSV, un format que lisent Excel et LibreOffice.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 pt-12 pb-24 md:pt-16 md:pb-32">
      <div className={container}>
        <SectionHeading
          badge="FAQ"
          intro={
            <>
              Une autre question&nbsp;?{" "}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-lp-brand-ink underline-offset-4 hover:underline"
              >
                Écrivez-nous sur WhatsApp
              </a>
              .
            </>
          }
        >
          Questions <Accent>fréquentes</Accent>
        </SectionHeading>

        <Reveal
          delay={200}
          className="mx-auto mt-14 max-w-4xl rounded-3xl border border-white/[0.07] bg-[linear-gradient(180deg,#15141f,#0f0f16)] p-3 sm:p-6 md:mt-16"
        >
          <ul className="space-y-3">
            {FAQS.map((faq, i) => {
              const isOpen = openIndex === i;
              const panelId = `faq-panel-${i}`;
              const buttonId = `faq-button-${i}`;
              return (
                <li
                  key={faq.q}
                  className={`rounded-2xl transition-colors duration-300 motion-reduce:transition-none ${
                    isOpen
                      ? "bg-[linear-gradient(110deg,rgb(79_70_229/0.28),rgb(49_46_129/0.18)_60%,rgb(30_27_75/0.3))]"
                      : "bg-[linear-gradient(110deg,rgb(49_46_129/0.22),rgb(30_27_75/0.18))] hover:bg-[linear-gradient(110deg,rgb(79_70_229/0.22),rgb(30_27_75/0.22))]"
                  }`}
                >
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="flex w-full items-center justify-between gap-6 rounded-2xl px-5 py-5 text-left text-[15px] font-medium text-lp-ink outline-none focus-visible:ring-2 focus-visible:ring-lp-brand-ink sm:px-6 sm:text-base"
                    >
                      <span>{faq.q}</span>
                      <ArrowUpRight
                        aria-hidden
                        className={`h-4 w-4 shrink-0 text-lp-ink-2 transition-transform duration-300 motion-reduce:transition-none ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    hidden={!isOpen}
                    className="mx-5 border-t border-white/10 pt-4 pb-6 text-sm leading-relaxed text-lp-ink-2 sm:mx-6 sm:text-[15px]"
                  >
                    {faq.a}
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
