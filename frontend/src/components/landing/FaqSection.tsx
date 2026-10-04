"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "L'essai gratuit de 14 jours est-il vraiment sans engagement ?",
    a: "Oui, à 100%. Vous créez votre compte en moins de 2 minutes sans renseigner aucune carte bancaire ni mode de paiement. Vous avez un accès complet à toutes les fonctionnalités pendant 14 jours pour tester avec vos vrais produits et vos équipes.",
  },
  {
    q: "Quels sont les tarifs et comment s'effectue le paiement ?",
    a: "Nos tarifs sont clairs et abordables : 5 000 FCFA par mois, ou 12 500 FCFA par trimestre (soit ~4 160 FCFA/mois). Grâce à notre passerelle de paiement AlphaPay, vous réglez en quelques clics via votre Mobile Money (MTN MoMo, Moov Money, Orange Money, Wave) ou par carte bancaire. L'activation de votre accès est instantanée.",
  },
  {
    q: "Est-il possible d'installer StockPro sur mon propre serveur ou réseau d'entreprise ?",
    a: "Absolument. Avec notre formule 'Déploiement Sur-Mesure', notre équipe s'occupe personnellement d'installer et configurer StockPro sur votre serveur dédié ou machine locale, avec votre nom de domaine personnalisé, la migration de vos anciens fichiers Excel et la formation de tout votre personnel.",
  },
  {
    q: "Est-ce facile à prendre en main pour mes caissiers et magasiniers ?",
    a: "Absolument. L'interface a été conçue pour le terrain : claire, épurée et en français simple. Un employé sans compétences informatiques particulières apprend à enregistrer une vente ou imprimer un ticket en moins de 15 minutes.",
  },
  {
    q: "Mes employés peuvent-ils voir mes prix d'achat et mes marges ?",
    a: "Non. Grâce au système de permissions étanches de StockPro, les employés avec le rôle Caissier ou Magasinier voient uniquement le prix de vente public. Vos prix de revient (PUMP), vos marges bénéficiaires et vos rapports financiers restent strictement réservés à vous (Directeur / Administrateur).",
  },
  {
    q: "Puis-je importer mes produits existants depuis un fichier Excel ou CSV ?",
    a: "Oui, vous pouvez importer tout votre catalogue d'articles, vos prix, vos stocks initiaux et votre répertoire de clients/fournisseurs en quelques clics via un fichier Excel ou CSV standard.",
  },
  {
    q: "Que se passe-t-il si j'ai des magasins dans des villes différentes (ex. Cotonou et Parakou, ou Abidjan et Bouaké) ?",
    a: "StockPro est hébergé sur le Cloud haute disponibilité. Vous pouvez connecter autant de magasins et d'entrepôts que vous le souhaitez, quelle que soit leur localisation géographique. Vous visualisez l'ensemble de votre réseau commercial en temps réel sur votre tableau de bord central.",
  },
  {
    q: "Quel matériel est compatible pour l'impression des tickets de caisse ?",
    a: "StockPro est compatible avec toutes les imprimantes thermiques standard (format 80mm et 58mm) branchées en USB, Bluetooth ou Réseau, ainsi qu'avec les imprimantes de bureau classiques (A4) pour les factures proforma et bons de livraison.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section id="faq" className="py-20 md:py-28 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 mb-4">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Questions Fréquentes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Tout ce que vous devez savoir avant de commencer
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400">
            Une question spécifique ? Notre équipe d&apos;assistance est également disponible par WhatsApp 7j/7 pour vous accompagner.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden transition-all duration-200 hover:border-zinc-700"
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left"
                >
                  <span className="text-base font-semibold text-white pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-indigo-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-white" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm text-zinc-300 leading-relaxed border-t border-zinc-800/60 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
