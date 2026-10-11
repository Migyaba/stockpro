"use client";

import { useState } from "react";
import { Loader2, Package, Plus, Search, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/Pagination";
import { NewProductSheet } from "@/components/dashboard/NewProductSheet";
import { CategoryManagerSheet } from "@/components/products/CategoryManagerSheet";
import { useAuthStore } from "@/lib/stores/authStore";
import { toast } from "@/lib/stores/toastStore";
import { cn, formatFCFA, formatQuantity } from "@/lib/utils/format";
import {
  useCategories,
  useDeactivateProduct,
  useProductsPage,
  useUpdateProduct,
} from "@/lib/hooks/useProducts";
import type { Product } from "@/lib/types/api";

const PAGE_SIZE = 25;
type ActiveFilter = "active" | "inactive" | "all";

export default function ProduitsPage() {
  const { permissions, canViewCost } = useAuthStore();
  const canCreate = permissions.includes("products.create");
  const canUpdate = permissions.includes("products.update");
  const canDeactivate = permissions.includes("products.deactivate");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("active");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  // null = fermé, "new" = création, Product = modification.
  const [sheetProduct, setSheetProduct] = useState<Product | "new" | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const { data: categories = [] } = useCategories();
  const { data, isLoading } = useProductsPage({
    page,
    page_size: PAGE_SIZE,
    search,
    category,
    is_active: activeFilter === "all" ? undefined : activeFilter === "active",
    ordering: "name",
  });
  const products = data?.results ?? [];
  const deactivate = useDeactivateProduct();
  const update = useUpdateProduct();

  function resetPage<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function toggleActive(product: Product) {
    if (product.is_active) {
      if (!confirm(`Désactiver « ${product.name} » ? Il ne pourra plus être vendu ni acheté.`)) return;
      deactivate.mutate(product.id, {
        onSuccess: () => toast.success("Produit désactivé."),
        onError: (err) => toast.apiError(err, "Impossible de désactiver le produit."),
      });
    } else {
      update.mutate(
        { id: product.id, payload: { is_active: true } },
        {
          onSuccess: () => toast.success("Produit réactivé."),
          onError: (err) => toast.apiError(err, "Impossible de réactiver le produit."),
        }
      );
    }
  }

  return (
    <div className="flex w-full flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Produits
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {data ? `${data.count} produit${data.count > 1 ? "s" : ""}` : "Catalogue"} · prix, seuils
            et stock total tous dépôts
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreate && (
            <button
              type="button"
              onClick={() => setCategoriesOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Tags className="h-3.5 w-3.5" />
              Catégories
            </button>
          )}
          {canCreate && (
            <button
              type="button"
              onClick={() => setSheetProduct("new")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <Plus className="h-3.5 w-3.5" />
              Nouveau produit
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => resetPage(setSearch)(e.target.value)}
            placeholder="Nom, SKU ou code-barres"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <select
          value={category}
          onChange={(e) => resetPage(setCategory)(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => resetPage(setActiveFilter)(e.target.value as ActiveFilter)}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="active">Actifs</option>
          <option value="inactive">Désactivés</option>
          <option value="all">Tous</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50/75 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40">
              <tr>
                <th className="px-4 py-3">Produit</th>
                <th className="hidden px-4 py-3 md:table-cell">Catégorie</th>
                {canViewCost && <th className="hidden px-4 py-3 text-right lg:table-cell">Prix d&apos;achat</th>}
                <th className="px-4 py-3 text-right">Prix de vente</th>
                <th className="px-4 py-3 text-right">Stock</th>
                {(canUpdate || canDeactivate) && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-zinc-400" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-zinc-500">
                    Aucun produit ne correspond.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const low = p.minimum_stock > 0 && (p.total_stock ?? 0) <= p.minimum_stock;
                  return (
                    <tr key={p.id} className={cn(!p.is_active && "opacity-60")}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{p.name}</p>
                        <p className="font-mono text-[11px] text-zinc-400">
                          {p.sku}
                          {p.barcode ? ` · ${p.barcode}` : ""}
                        </p>
                        {!p.is_active && <Badge variant="secondary">Désactivé</Badge>}
                      </td>
                      <td className="hidden px-4 py-3 text-zinc-500 md:table-cell">
                        {p.category_name ?? "—"}
                      </td>
                      {canViewCost && (
                        <td className="hidden px-4 py-3 text-right tabular-nums text-zinc-500 lg:table-cell">
                          {formatFCFA(p.purchase_price)}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right tabular-nums">{formatFCFA(p.selling_price)}</td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right tabular-nums font-medium",
                          (p.total_stock ?? 0) === 0
                            ? "text-rose-600 dark:text-rose-400"
                            : low
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-zinc-900 dark:text-zinc-100"
                        )}
                      >
                        {formatQuantity(p.total_stock ?? 0)} <span className="text-xs font-normal text-zinc-400">{p.unit}</span>
                      </td>
                      {(canUpdate || canDeactivate) && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-3 text-xs">
                            {canUpdate && p.is_active && (
                              <button
                                type="button"
                                onClick={() => setSheetProduct(p)}
                                className="font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                              >
                                Modifier
                              </button>
                            )}
                            {(p.is_active ? canDeactivate : canUpdate) && (
                              <button
                                type="button"
                                onClick={() => toggleActive(p)}
                                className="text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-200"
                              >
                                {p.is_active ? "Désactiver" : "Réactiver"}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.count ?? 0} onPageChange={setPage} />
      </div>

      <NewProductSheet
        key={sheetProduct && sheetProduct !== "new" ? sheetProduct.id : "new"}
        open={sheetProduct !== null}
        onOpenChange={(open) => !open && setSheetProduct(null)}
        product={sheetProduct && sheetProduct !== "new" ? sheetProduct : null}
      />
      <CategoryManagerSheet open={categoriesOpen} onOpenChange={setCategoriesOpen} />
    </div>
  );
}
