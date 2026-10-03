"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Truck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  FileText,
  UserCheck,
  Package,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import type { Supplier } from "@/lib/types/api";

interface SupplierDetailSheetProps {
  supplier: Supplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierDetailSheet({
  supplier,
  open,
  onOpenChange,
}: SupplierDetailSheetProps) {
  if (!supplier) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white dark:bg-zinc-900 p-0 border-l border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
          <SheetHeader>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-3 w-3" />
                Fournisseur Agréé
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                {supplier.id}
              </span>
            </div>
            <SheetTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Truck className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{supplier.name}</span>
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Corps de la fiche */}
        <div className="p-6 space-y-6">
          {/* Action rapide : Nouvel achat */}
          <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl dark:bg-indigo-950/20 dark:border-indigo-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Commander du stock
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Créer un bon de commande
                </p>
              </div>
            </div>
            <Link
              href="/achats"
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Aller aux achats
            </Link>
          </div>

          {/* Interlocuteur principal */}
          {supplier.contact_name && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">
                  Contact Principal
                </p>
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {supplier.contact_name}
                </p>
              </div>
            </div>
          )}

          {/* Coordonnées */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Coordonnées de l'entreprise
            </h4>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
                <span>{supplier.phone || "Non renseigné"}</span>
              </div>

              <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
                <span>{supplier.email || "Non renseigné"}</span>
              </div>

              <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
                <span>
                  {supplier.address
                    ? `${supplier.address}, ${supplier.city || ""}`
                    : supplier.city || "Non renseigné"}
                  {supplier.country ? ` (${supplier.country})` : ""}
                </span>
              </div>

              {supplier.created_at && (
                <div className="flex items-center gap-3 text-zinc-500">
                  <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
                  <span>
                    Partenaire depuis le{" "}
                    {new Date(supplier.created_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Conditions & Notes */}
          {supplier.notes && (
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Conditions de livraison & Paiement
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 leading-relaxed whitespace-pre-wrap">
                {supplier.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
