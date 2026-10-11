"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAndStartInventory,
  fetchInventories,
  fetchInventory,
  fetchInventoryLines,
  inventoryAction,
  recordCounts,
  type InventoryFilters,
  type LineFilters,
} from "@/lib/api/inventories";
import type { CountEntry } from "@/lib/types/api";

const KEY = "inventories";

export function useInventories(filters: InventoryFilters = {}) {
  return useQuery({
    queryKey: [KEY, "list", filters],
    queryFn: () => fetchInventories(filters),
    staleTime: 30_000,
  });
}

export function useInventory(id: string) {
  return useQuery({ queryKey: [KEY, id], queryFn: () => fetchInventory(id) });
}

export function useInventoryLines(id: string, filters: LineFilters) {
  return useQuery({
    queryKey: [KEY, id, "lines", filters],
    queryFn: () => fetchInventoryLines(id, filters),
    placeholderData: keepPreviousData,
  });
}

export function useCreateInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAndStartInventory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useRecordCounts(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lines: CountEntry[]) => recordCounts(id, lines),
    // Progression et lignes rafraîchies (stats du compteur « comptés / total »).
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, id] }),
  });
}

export function useInventoryAction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: "review" | "reopen" | "validate" | "cancel") => inventoryAction(id, action),
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      if (action === "validate") {
        queryClient.invalidateQueries({ queryKey: ["stock"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["reports"] });
      }
    },
  });
}
