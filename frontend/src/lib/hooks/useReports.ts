"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchPurchasesReport, fetchSalesReport } from "@/lib/api/reports";
import type { ReportPeriodParams } from "@/lib/types/api";

// keepPreviousData : au changement de période, l'ancien rendu reste affiché
// (atténué) pendant le rechargement, sans saut de mise en page.
export function useSalesReport(params: ReportPeriodParams, enabled = true) {
  return useQuery({
    queryKey: ["reports", "sales", params],
    queryFn: () => fetchSalesReport(params),
    placeholderData: keepPreviousData,
    enabled,
    staleTime: 60_000,
  });
}

export function usePurchasesReport(params: ReportPeriodParams, enabled = true) {
  return useQuery({
    queryKey: ["reports", "purchases", params],
    queryFn: () => fetchPurchasesReport(params),
    placeholderData: keepPreviousData,
    enabled,
    staleTime: 60_000,
  });
}
