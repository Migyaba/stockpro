"use client";

import { Warehouse, ArrowRightLeft, ShieldCheck, Check, Layers, Truck } from "lucide-react";
import Link from "next/link";

export function MultiDepotShowcase() {
  return (
    <section id="multi-depots" className="py-20 md:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Text & Arguments */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-400 mb-6">
              <Warehouse className="h-3.5 w-3.5" />
              <span>Multi-Magasins & Entrepôts Connectés</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Connectez votre grand entrepôt et toutes vos boutiques sur un seul écran.
            </h2>

            <p className="mt-4 text-base sm:text-lg text-zinc-300 leading-relaxed">
              Que vous ayez un dépôt central au port ou en zone industrielle et plusieurs boutiques de vente au marché, StockPro centralise l&apos;intégralité de vos stocks avec une fluidité absolue.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Transferts inter-dépôts sécurisés</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Émission automatique de bons de transfert. La marchandise quitte le stock du dépôt A uniquement lorsque le dépôt B valide la bonne réception.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Vue d&apos;ensemble et stock consolidé</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Consultez la disponibilité d&apos;un article dans tous vos magasins en un clic pour ne plus jamais refuser une vente à un client.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Inventaire physique guidé</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Organisez des inventaires tournants ou généraux sans fermer vos magasins. Calcul automatique des écarts et régularisation conforme.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
              >
                <span>Configurer mes dépôts gratuitement</span>
                <Warehouse className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Transfer Demo Card */}
          <div className="relative">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-indigo-400" />
                  <span className="text-sm font-semibold text-white">
                    Transfert Inter-Dépôts #TR-042
                  </span>
                </div>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/20">
                  En Transit
                </span>
              </div>

              {/* Origin & Destination Nodes */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Origine (Expéditeur)
                  </span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Warehouse className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm font-bold text-white">Entrepôt Akpakpa (Port)</span>
                  </div>
                  <p className="text-xs text-emerald-400 mt-1">✓ Stock sorti : 50 cartons</p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Destination (Récepteur)
                  </span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Warehouse className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-bold text-white">Boutique Dantokpa</span>
                  </div>
                  <p className="text-xs text-amber-400 mt-1">En attente de réception...</p>
                </div>
              </div>

              {/* Middle arrow indicator */}
              <div className="flex items-center justify-center my-4">
                <div className="flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3 py-1 text-xs text-indigo-300">
                  <ArrowRightLeft className="h-3.5 w-3.5 animate-pulse" />
                  <span>Camion en route • Chauffeur : Bio Moussa</span>
                </div>
              </div>

              {/* Items in transit */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                <span className="text-xs font-semibold text-zinc-300 block mb-2">
                  Articles transférés
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-zinc-300 py-1 border-b border-zinc-800/50">
                    <span>Huile végétale 5L (Cartons)</span>
                    <span className="font-mono font-semibold text-white">30 Cartons</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-300 py-1">
                    <span>Riz Parfumé 25kg (Sacs)</span>
                    <span className="font-mono font-semibold text-white">20 Sacs</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Double signature requise</span>
                </span>
                <span className="font-mono text-[11px] text-indigo-400">
                  Zéro perte certifiée
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
