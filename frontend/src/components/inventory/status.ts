import type { InventoryStatus } from "@/lib/types/api";

export const INVENTORY_STATUS: Record<
  InventoryStatus,
  { label: string; variant: "secondary" | "default" | "warning" | "success" }
> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  COUNTING: { label: "Comptage en cours", variant: "default" },
  REVIEW: { label: "En revue", variant: "warning" },
  VALIDATED: { label: "Validé", variant: "success" },
  CANCELLED: { label: "Annulé", variant: "secondary" },
};
