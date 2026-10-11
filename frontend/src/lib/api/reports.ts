import apiClient from "@/lib/api/client";
import type {
  ExportKind,
  PurchasesReport,
  ReportPeriodParams,
  SalesReport,
} from "@/lib/types/api";

function clean(params: ReportPeriodParams): Record<string, string> {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => !!v)) as Record<string, string>;
}

export async function fetchSalesReport(params: ReportPeriodParams): Promise<SalesReport> {
  const { data } = await apiClient.get<SalesReport>("/reports/sales-summary/", {
    params: clean(params),
  });
  return data;
}

export async function fetchPurchasesReport(params: ReportPeriodParams): Promise<PurchasesReport> {
  const { data } = await apiClient.get<PurchasesReport>("/reports/purchases-summary/", {
    params: clean(params),
  });
  return data;
}

// Téléchargement authentifié (le JWT est dans l'en-tête, pas dans l'URL).
export async function downloadExport(kind: ExportKind, params: ReportPeriodParams): Promise<void> {
  const response = await apiClient.get<Blob>(`/reports/export/${kind}/`, {
    params: clean(params),
    responseType: "blob",
    timeout: 60_000,
  });
  const disposition = String(response.headers["content-disposition"] ?? "");
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? `${kind}.csv`;
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
