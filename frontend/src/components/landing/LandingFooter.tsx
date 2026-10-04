"use client";

import Link from "next/link";
import { ShieldCheck, Heart } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950 pt-16 pb-12 text-zinc-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 pb-12 border-b border-zinc-800/60">
          {/* Brand info */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-white"
                  aria-hidden
                >
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                  <path d="m3.3 7 8.7 5 8.7-5" />
                  <path d="M12 22V12" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                STOCKPRO
              </span>
            </Link>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              La solution SaaS de gestion commerciale et de stocks multi-dépôts pensée sur-mesure pour les commerçants, grossistes et distributeurs d&apos;Afrique de l&apos;Ouest et Centrale.
            </p>
            <div className="flex items-center gap-2 text-zinc-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Chiffrement SSL 256 bits & Sauvegardes Cloud quotidiennes</span>
            </div>
          </div>

          {/* Produit */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Produit
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#fonctionnalites" className="hover:text-white transition-colors">
                  Fonctionnalités
                </a>
              </li>
              <li>
                <a href="#multi-depots" className="hover:text-white transition-colors">
                  Gestion Multi-Dépôts
                </a>
              </li>
              <li>
                <a href="#comparatif" className="hover:text-white transition-colors">
                  Caisse POS & Tickets
                </a>
              </li>
              <li>
                <a href="#tarifs" className="hover:text-white transition-colors">
                  Tarifs en FCFA
                </a>
              </li>
              <li>
                <Link href="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  Essai Gratuit 14j
                </Link>
              </li>
            </ul>
          </div>

          {/* Hubs & Marchés */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Villes Couvertes
            </h4>
            <ul className="space-y-2 text-zinc-400">
              <li>Cotonou & Porto-Novo</li>
              <li>Abidjan & San-Pédro</li>
              <li>Dakar & Touba</li>
              <li>Lomé & Kara</li>
              <li>Douala & Yaoundé</li>
              <li>Ouagadougou & Bobo</li>
            </ul>
          </div>

          {/* Accès Rapide */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Espace Client
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Connexion à votre espace
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Créer une organisation
                </Link>
              </li>
              <li>
                <a
                  href="https://apistockpro.miguelmissetcho.com/api/docs/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Documentation API Swagger
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/22943507805"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors text-emerald-400"
                >
                  Assistance WhatsApp (+229 43 50 78 05)
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} STOCKPRO SaaS. Tous droits réservés.</p>
          <div className="flex items-center gap-1">
            <span>Développé avec</span>
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 inline" />
            <span>pour l&apos;essor économique de l&apos;Afrique francophone</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
