"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Boxes,
  ShoppingCart,
  Calendar,
  Filter,
  Download,
  Building2,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";
import { formatFCFA, formatFCFAShort } from "@/lib/utils/format";
import { useDashboardKpis } from "@/lib/hooks/useDashboard";
import { useSales } from "@/lib/hooks/useSales";
import { useProducts } from "@/lib/hooks/useProducts";
import { useWarehouses } from "@/lib/hooks/useWarehouses";
import type { SaleItem } from "@/lib/types/api";

type PeriodFilter = "7d" | "30d" | "month" | "year";

function getCategoryName(cat: unknown): string {
  if (!cat) return "Général";
  if (typeof cat === "string") return cat;
  if (typeof cat === "object" && cat !== null && "name" in cat) {
    return String((cat as { name: string }).name) || "Général";
  }
  return "Général";
}

export default function RapportsPage() {
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("ALL");

  // Real data from queries
  const { data: kpis } = useDashboardKpis();
  const { data: salesData } = useSales();
  const { data: products = [] } = useProducts();
  const { data: warehouses = [] } = useWarehouses();

  const salesList = useMemo(() => {
    if (!salesData) return [];
    if ("results" in salesData && Array.isArray(salesData.results)) {
      return salesData.results;
    }
    if (Array.isArray(salesData)) return salesData;
    return [];
  }, [salesData]);

  // Product map for cost/margin lookup
  const productMap = useMemo(() => {
    return new Map(products.map((p) => [p.id, p]));
  }, [products]);

  // Filter sales by warehouse and period
  const filteredSales = useMemo(() => {
    let list = salesList;
    if (selectedWarehouseId !== "ALL") {
      list = list.filter((s) => String(s.warehouse) === String(selectedWarehouseId));
    }

    const now = new Date();
    if (period === "7d") {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      list = list.filter((s) => new Date(s.sale_date || (s as any).created_at || now) >= cutoff);
    } else if (period === "30d") {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      list = list.filter((s) => new Date(s.sale_date || (s as any).created_at || now) >= cutoff);
    } else if (period === "year") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      list = list.filter((s) => new Date(s.sale_date || (s as any).created_at || now) >= startOfYear);
    }
    return list;
  }, [salesList, selectedWarehouseId, period]);

  // Real financial metrics
  const stats = useMemo(() => {
    const completedSales = filteredSales.filter((s) => s.status === "COMPLETED");
    const totalSalesAmount = completedSales.reduce((acc, s) => acc + (s.total || 0), 0);
    const completedSalesCount = completedSales.length;

    // Real Stock valuation from backend KPIs or product cost
    const stockValuation = kpis?.stock_value ?? 0;

    // Real margin calculated from sale items
    let totalCost = 0;
    completedSales.forEach((sale) => {
      (sale.items || []).forEach((item: SaleItem) => {
        const prod = productMap.get(item.product);
        const costPrice = prod?.purchase_price ?? 0;
        totalCost += costPrice * (item.quantity || 1);
      });
    });

    const potentialMargin = totalSalesAmount > 0 ? Math.max(0, totalSalesAmount - totalCost) : 0;
    const potentialMarginPct = totalSalesAmount > 0 ? Math.round((potentialMargin / totalSalesAmount) * 100) : 0;

    return {
      stockValuation,
      potentialMargin,
      potentialMarginPct,
      totalSalesAmount,
      completedSalesCount,
    };
  }, [filteredSales, kpis, productMap]);

  // Daily chart data dynamically calculated for the last 7 days
  const chartDays = useMemo(() => {
    const days: { day: string; dateStr: string; ca: number; marge: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
      const capitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      days.push({ day: capitalized, dateStr, ca: 0, marge: 0 });
    }

    const completedSales = filteredSales.filter((s) => s.status === "COMPLETED");
    completedSales.forEach((s) => {
      const rawDate = (s.sale_date || (s as any).created_at || "").slice(0, 10);
      const dayEntry = days.find((d) => d.dateStr === rawDate);
      if (dayEntry) {
        dayEntry.ca += s.total || 0;
        let saleCost = 0;
        (s.items || []).forEach((item: SaleItem) => {
          const prod = productMap.get(item.product);
          saleCost += (prod?.purchase_price ?? 0) * (item.quantity || 1);
        });
        dayEntry.marge += Math.max(0, (s.total || 0) - saleCost);
      }
    });

    return days;
  }, [filteredSales, productMap]);

  const maxCa = Math.max(...chartDays.map((d) => d.ca), 1);

  // Top products calculated from real sale items
  const topProducts = useMemo(() => {
    const map = new Map<string, {
      name: string;
      sku: string;
      category: string;
      unitsSold: number;
      revenue: number;
      cost: number;
    }>();

    const completedSales = filteredSales.filter((s) => s.status === "COMPLETED");
    completedSales.forEach((s) => {
      (s.items || []).forEach((item: SaleItem) => {
        const prod = productMap.get(item.product);
        const name = item.product_name || prod?.name || "Article";
        const sku = prod?.sku || "SKU-N/A";
        const category = getCategoryName(prod?.category);
        const costPrice = prod?.purchase_price ?? 0;

        const current = map.get(item.product) || {
          name,
          sku,
          category,
          unitsSold: 0,
          revenue: 0,
          cost: 0,
        };

        current.unitsSold += item.quantity || 1;
        current.revenue += item.total || 0;
        current.cost += costPrice * (item.quantity || 1);
        map.set(item.product, current);
      });
    });

    return Array.from(map.values())
      .map((p) => {
        const margin = Math.max(0, p.revenue - p.cost);
        const marginPct = p.revenue > 0 ? Math.round((margin / p.revenue) * 100) : 0;
        return {
          ...p,
          margin,
          marginPct,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredSales, productMap]);

  // Real Warehouse breakdown
  const warehouseBreakdown = useMemo(() => {
    if (warehouses.length === 0) return [];
    const completedSales = filteredSales.filter((s) => s.status === "COMPLETED");
    const totalRevenue = stats.totalSalesAmount || 1;

    return warehouses.map((wh) => {
      const whSales = completedSales
        .filter((s) => String(s.warehouse) === String(wh.id))
        .reduce((acc, s) => acc + (s.total || 0), 0);
      const share = stats.totalSalesAmount > 0 ? Math.round((whSales / totalRevenue) * 100) : 0;

      return {
        id: wh.id,
        name: wh.name,
        code: wh.code,
        share,
        sales: whSales,
      };
    });
  }, [warehouses, filteredSales, stats.totalSalesAmount]);

  // Real Category breakdown from products
  const categoryStats = useMemo(() => {
    if (products.length === 0) return [];
    const catMap = new Map<string, number>();
    products.forEach((p) => {
      const cat = getCategoryName(p.category);
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
    });

    const colors = ["bg-indigo-600", "bg-emerald-600", "bg-amber-500", "bg-rose-500", "bg-purple-600"];
    const totalCount = products.length || 1;

    return Array.from(catMap.entries()).map(([name, count], idx) => ({
      name,
      share: Math.round((count / totalCount) * 100),
      count,
      color: colors[idx % colors.length],
    }));
  }, [products]);

  const handleExportCSV = () => {
    const headers = "SKU,Produit,Catégorie,Unités Vendues,Chiffre d'Affaires (FCFA),Marge Brute (FCFA)\n";
    const rows = topProducts
      .map(
        (p) =>
          `"${p.sku}","${p.name}","${p.category}",${p.unitsSold},${p.revenue},${p.margin}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `rapport_ventes_stockpro_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Rapports & Performance Commerciale</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Analyse des marges, de la rotation des stocks et du chiffre d&apos;affaires en Franc CFA (FCFA).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Warehouse Selector */}
          <div className="relative">
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="appearance-none pl-7 pr-8 py-2 text-xs font-semibold rounded-lg border border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">Tous les dépôts</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <Building2 className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          </div>

          {/* Period Selector */}
          <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-800/60 text-xs">
            <button
              onClick={() => setPeriod("7d")}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
                period === "7d"
                  ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
              }`}
            >
              7 jours
            </button>
            <button
              onClick={() => setPeriod("30d")}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
                period === "30d"
                  ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
              }`}
            >
              30 jours
            </button>
            <button
              onClick={() => setPeriod("year")}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
                period === "year"
                  ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
              }`}
            >
              Cette année
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* ─── 4 KPIs Financiers ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chiffre d'Affaires */}
        <div className="p-5 rounded-xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Chiffre d&apos;Affaires
            </span>
            <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            {formatFCFA(stats.totalSalesAmount)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <span>
              {stats.completedSalesCount > 0
                ? `${stats.completedSalesCount} bon${stats.completedSalesCount > 1 ? "s" : ""} de vente`
                : "Aucune vente sur la période"}
            </span>
          </div>
        </div>

        {/* Marge Brute */}
        <div className="p-5 rounded-xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Marge Brute Réalisée
            </span>
            <div className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatFCFA(stats.potentialMargin)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {stats.potentialMarginPct}%
            </span>
            <span>de marge commerciale moyenne</span>
          </div>
        </div>

        {/* Valeur du Stock */}
        <div className="p-5 rounded-xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Valeur du Stock Actuel
            </span>
            <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            {formatFCFA(stats.stockValuation)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>Prix d&apos;achat hors taxes immobilisé</span>
          </div>
        </div>

        {/* Ventes Enregistrées */}
        <div className="p-5 rounded-xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Bons de Vente Clôturés
            </span>
            <div className="h-7 w-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            {stats.completedSalesCount}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <span>Ticket moyen : {formatFCFAShort(Math.round(stats.totalSalesAmount / (stats.completedSalesCount || 1)))}</span>
          </div>
        </div>
      </div>

      {/* ─── Graphique des Ventes (Barres SVG) ─────────────────────────────── */}
      <div className="p-6 rounded-xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Évolution Journalière des Ventes & Marges</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Chiffre d&apos;affaires journalier (bleu) et marge brute dégagée (vert) sur les 7 derniers jours
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-indigo-600" />
              <span className="text-zinc-600 dark:text-zinc-400">Ventes (FCFA)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-emerald-500" />
              <span className="text-zinc-600 dark:text-zinc-400">Marge (FCFA)</span>
            </div>
          </div>
        </div>

        {/* Bar chart container */}
        <div className="pt-4 pb-2">
          {stats.totalSalesAmount === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-400 dark:text-zinc-500 gap-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <BarChart3 className="h-8 w-8 stroke-[1.5] text-zinc-300 dark:text-zinc-600" />
              <p className="text-xs">Aucune vente enregistrée sur les 7 derniers jours</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-3 items-end h-56 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              {chartDays.map((item, idx) => {
                const heightPct = Math.round((item.ca / maxCa) * 100);
                const marginHeightPct = Math.round((item.marge / maxCa) * 100);

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1.5 h-full">
                      {/* Bar Ventes */}
                      <div
                        style={{ height: `${Math.max(heightPct, 4)}%` }}
                        className="w-1/2 max-w-7 bg-indigo-600 hover:bg-indigo-700 rounded-t-md transition-all duration-300 relative group"
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap pointer-events-none z-10 shadow-lg">
                          Ventes: {formatFCFA(item.ca)}
                        </div>
                      </div>

                      {/* Bar Marge */}
                      <div
                        style={{ height: `${Math.max(marginHeightPct, 4)}%` }}
                        className="w-1/2 max-w-7 bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all duration-300 relative group"
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap pointer-events-none z-10 shadow-lg">
                          Marge: {formatFCFA(item.marge)}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Deux Colonnes : Dépôts & Catégories ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance par Dépôt */}
        <div className="p-6 rounded-xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Contribution par Point de Vente</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Part du chiffre d&apos;affaires généré par chaque dépôt
            </p>
          </div>

          <div className="space-y-4">
            {warehouseBreakdown.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">Aucun dépôt configuré.</p>
            ) : (
              warehouseBreakdown.map((wh) => (
                <div key={wh.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {wh.name}
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {wh.share}% ({formatFCFA(wh.sales)})
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      style={{ width: `${wh.share}%` }}
                      className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>Code: {wh.code}</span>
                    <span>Total ventes: {formatFCFA(wh.sales)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Répartition par Famille de Produits */}
        <div className="p-6 rounded-xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Répartition par Catégorie de Produits</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Articles actifs par catégorie dans le catalogue
            </p>
          </div>

          <div className="space-y-4">
            {categoryStats.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">Aucune catégorie répertoriée.</p>
            ) : (
              categoryStats.map((cat) => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {cat.name}
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {cat.share}% ({cat.count} article{cat.count > 1 ? "s" : ""})
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      style={{ width: `${cat.share}%` }}
                      className={`h-full rounded-full ${cat.color} transition-all duration-300`}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── Tableau Top 5 Produits les plus rentables ─────────────────────── */}
      <div className="rounded-xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/75 dark:border-zinc-800 dark:bg-zinc-800/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Palmarès des Articles les Plus Rentables
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Classement par marge brute dégagée sur la période
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
            TOP 5 PRODUITS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-800/30 text-zinc-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Article</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4 text-center">Unités Vendues</th>
                <th className="py-3 px-4 text-right">C.A. Réalisé</th>
                <th className="py-3 px-4 text-right">Marge Brute</th>
                <th className="py-3 px-4 text-right">Taux de Marge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="h-8 w-8 stroke-[1.5] text-zinc-300 dark:text-zinc-600" />
                      <p className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                        Aucun produit vendu sur la période
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Les articles les plus rentables apparaîtront ici dès que vos premières ventes seront clôturées.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                topProducts.map((p, idx) => (
                  <tr key={p.sku} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 flex items-center justify-center font-bold text-[11px]">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {p.name}
                          </p>
                          <p className="font-mono text-[10px] text-zinc-400">
                            {p.sku}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {p.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-semibold text-zinc-900 dark:text-zinc-100">
                      {p.unitsSold}
                    </td>

                    <td className="py-3 px-4 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatFCFA(p.revenue)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatFCFA(p.margin)}
                    </td>

                    <td className="py-3 px-4 text-right font-semibold">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {p.marginPct}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
