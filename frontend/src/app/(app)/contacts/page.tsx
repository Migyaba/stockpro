"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Truck,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Building,
  UserCheck,
  ChevronRight,
  Loader2,
  ExternalLink,
  Building2,
  Filter,
} from "lucide-react";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useSuppliers } from "@/lib/hooks/useSuppliers";
import { NewCustomerSheet } from "@/components/contacts/NewCustomerSheet";
import { NewSupplierSheet } from "@/components/contacts/NewSupplierSheet";
import { CustomerDetailSheet } from "@/components/contacts/CustomerDetailSheet";
import { SupplierDetailSheet } from "@/components/contacts/SupplierDetailSheet";
import type { Customer, Supplier } from "@/lib/types/api";

type TabType = "customers" | "suppliers";

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("customers");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("ALL");

  // Sheets state
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newSupplierOpen, setNewSupplierOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Queries
  const { data: customers = [], isLoading: isLoadingCustomers } = useCustomers();
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useSuppliers();

  // All unique cities
  const allCities = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.city?.trim()) set.add(c.city.trim());
    });
    suppliers.forEach((s) => {
      if (s.city?.trim()) set.add(s.city.trim());
    });
    return Array.from(set).sort();
  }, [customers, suppliers]);

  // Filtered lists
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.city && c.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.phone && c.phone.includes(searchQuery));
      const matchCity = selectedCity === "ALL" || c.city === selectedCity;
      return matchSearch && matchCity;
    });
  }, [customers, searchQuery, selectedCity]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.contact_name &&
          s.contact_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.city && s.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.phone && s.phone.includes(searchQuery));
      const matchCity = selectedCity === "ALL" || s.city === selectedCity;
      return matchSearch && matchCity;
    });
  }, [suppliers, searchQuery, selectedCity]);

  // KPIs
  const totalCustomers = customers.length;
  const totalSuppliers = suppliers.length;
  const totalCitiesCount = allCities.length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Contacts & Partenaires
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Gérez vos clients acheteurs et vos fournisseurs d'approvisionnement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "customers" ? (
            <button
              onClick={() => setNewCustomerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Client</span>
            </button>
          ) : (
            <button
              onClick={() => setNewSupplierOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Fournisseur</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── 4 KPIs ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-medium">Clients enregistrés</span>
            <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {totalCustomers}
          </div>
          <span className="text-[11px] text-zinc-400">Commerçants & demi-grossistes</span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-medium">Fournisseurs partenaires</span>
            <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {totalSuppliers}
          </div>
          <span className="text-[11px] text-zinc-400">Usines, brasseries & importateurs</span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-medium">Villes & Marchés</span>
            <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {totalCitiesCount}
          </div>
          <span className="text-[11px] text-zinc-400">Zones géographiques couvertes</span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-medium">Total Annuaire</span>
            <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {totalCustomers + totalSuppliers}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Réseau actif</span>
        </div>
      </div>

      {/* ─── Navigation Onglets & Filtres ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab("customers");
              setSearchQuery("");
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === "customers"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Clients</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "customers"
                  ? "bg-indigo-500 text-white"
                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {totalCustomers}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("suppliers");
              setSearchQuery("");
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === "suppliers"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Truck className="h-4 w-4" />
            <span>Fournisseurs</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "suppliers"
                  ? "bg-indigo-500 text-white"
                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {totalSuppliers}
            </span>
          </button>
        </div>

        {/* Search & City Filter */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === "customers"
                  ? "Rechercher un client..."
                  : "Rechercher un fournisseur..."
              }
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="appearance-none pl-7 pr-8 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">Toutes les villes</option>
              {allCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <Filter className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ─── Table Content ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
        {activeTab === "customers" ? (
          /* Table Clients */
          isLoadingCustomers ? (
            <div className="p-12 text-center text-zinc-400 flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <p className="text-xs">Chargement des clients...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 space-y-3">
              <Users className="h-10 w-10 mx-auto text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                Aucun client trouvé
              </p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {searchQuery
                  ? "Aucun résultat ne correspond à votre recherche."
                  : "Commencez par enregistrer vos premiers clients pour fluidifier vos ventes."}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setNewCustomerOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Ajouter un client</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/75 dark:border-zinc-800 dark:bg-zinc-800/40 text-zinc-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Client / Raison Sociale</th>
                    <th className="py-3 px-4">Téléphone</th>
                    <th className="py-3 px-4">Ville & Adresse</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredCustomers.map((cust) => (
                    <tr
                      key={cust.id}
                      onClick={() => setSelectedCustomer(cust)}
                      className="group cursor-pointer hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {cust.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {cust.name}
                            </p>
                            {cust.notes && (
                              <p className="text-[11px] text-zinc-400 truncate max-w-xs">
                                {cust.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                        {cust.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            <span>{cust.phone}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span>{cust.city || "Cotonou"}</span>
                          {cust.address && (
                            <span className="text-zinc-400 text-[11px]">
                              ({cust.address})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-zinc-500">
                        {cust.email || "—"}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(cust);
                          }}
                          className="p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Voir la fiche détaillée"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Table Fournisseurs */
          isLoadingSuppliers ? (
            <div className="p-12 text-center text-zinc-400 flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <p className="text-xs">Chargement des fournisseurs...</p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 space-y-3">
              <Truck className="h-10 w-10 mx-auto text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                Aucun fournisseur trouvé
              </p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {searchQuery
                  ? "Aucun résultat ne correspond à votre recherche."
                  : "Ajoutez vos fournisseurs réguliers pour enregistrer vos achats de stock."}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setNewSupplierOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Ajouter un fournisseur</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/75 dark:border-zinc-800 dark:bg-zinc-800/40 text-zinc-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Fournisseur / Entreprise</th>
                    <th className="py-3 px-4">Contact Commercial</th>
                    <th className="py-3 px-4">Téléphone</th>
                    <th className="py-3 px-4">Localisation</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredSuppliers.map((sup) => (
                    <tr
                      key={sup.id}
                      onClick={() => setSelectedSupplier(sup)}
                      className="group cursor-pointer hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {sup.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {sup.name}
                            </p>
                            {sup.email && (
                              <p className="text-[11px] text-zinc-400">
                                {sup.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">
                        {sup.contact_name ? (
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            <span>{sup.contact_name}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic">Non spécifié</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span>{sup.phone || "—"}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span>
                            {sup.city || "—"}
                            {sup.country ? ` (${sup.country})` : ""}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSupplier(sup);
                          }}
                          className="p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Voir la fiche détaillée"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* ─── Sheets ────────────────────────────────────────────────────────── */}
      <NewCustomerSheet
        open={newCustomerOpen}
        onOpenChange={setNewCustomerOpen}
      />
      <NewSupplierSheet
        open={newSupplierOpen}
        onOpenChange={setNewSupplierOpen}
      />
      <CustomerDetailSheet
        customer={selectedCustomer}
        open={Boolean(selectedCustomer)}
        onOpenChange={(open) => !open && setSelectedCustomer(null)}
      />
      <SupplierDetailSheet
        supplier={selectedSupplier}
        open={Boolean(selectedSupplier)}
        onOpenChange={(open) => !open && setSelectedSupplier(null)}
      />
    </div>
  );
}
