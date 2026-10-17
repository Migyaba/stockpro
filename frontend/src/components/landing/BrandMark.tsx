import { Package } from "lucide-react";

// Même traitement que le logo de la barre latérale de l'application :
// carré indigo, icône Package, nom en capitales.
export function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lp-mark text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_16px_-6px_rgb(79_70_229/0.9)]">
        <Package className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </span>
      <span className="text-[15px] font-bold tracking-tight text-lp-ink">STOCKPRO</span>
    </span>
  );
}
