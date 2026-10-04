"use client";

import { useState, useEffect } from "react";
import {
  Building,
  Boxes,
  Users,
  Shield,
  Plus,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Tag,
  UserCheck,
  Globe,
  Coins,
  Percent,
  CreditCard,
} from "lucide-react";
import {
  useOrganizationProfile,
  useUpdateOrganizationProfile,
  useOrganizationMembers,
  useToggleMemberActive,
} from "@/lib/hooks/useOrganization";
import {
  useWarehouses,
  useToggleWarehouseActive,
} from "@/lib/hooks/useWarehouses";
import { NewWarehouseSheet } from "@/components/settings/NewWarehouseSheet";
import { InviteMemberSheet } from "@/components/settings/InviteMemberSheet";
import { SubscriptionSection } from "@/components/settings/SubscriptionSection";
import type { Role } from "@/lib/types/api";

type SettingsTab = "org" | "warehouses" | "team" | "security" | "billing";

export default function ParametresPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("org");
  const [newWarehouseOpen, setNewWarehouseOpen] = useState(false);
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Queries & Mutations
  const { data: org, isLoading: isLoadingOrg } = useOrganizationProfile();
  const updateOrg = useUpdateOrganizationProfile();
  const { data: warehouses = [], isLoading: isLoadingWarehouses } = useWarehouses();
  const toggleWarehouse = useToggleWarehouseActive();
  const { data: members = [], isLoading: isLoadingMembers } = useOrganizationMembers();
  const toggleMember = useToggleMemberActive();

  // Local state for org form
  const [orgForm, setOrgForm] = useState({
    name: "",
    country: "BJ",
    currency: "XOF",
    timezone: "Africa/Porto-Novo",
    tax_enabled: true,
    tax_rate_bps: 1800,
    address: "",
    phone: "",
  });

  // Sync form when org data is loaded
  useEffect(() => {
    if (org) {
      setOrgForm({
        name: org.name || "",
        country: org.country || "BJ",
        currency: org.currency || "XOF",
        timezone: org.timezone || "Africa/Porto-Novo",
        tax_enabled: org.tax_enabled ?? true,
        tax_rate_bps: org.tax_rate_bps ?? 1800,
        address: org.address || "",
        phone: org.phone || "",
      });
    }
  }, [org]);

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    try {
      await updateOrg.mutateAsync(orgForm);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // Handled
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case "OWNER":
        return "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "ADMINISTRATOR":
        return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
      case "MANAGER":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "STAFF":
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
    }
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case "OWNER":
        return "Propriétaire";
      case "ADMINISTRATOR":
        return "Administrateur";
      case "MANAGER":
        return "Gestionnaire";
      case "STAFF":
      default:
        return "Caissier / Opérateur";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Paramètres de l'Entreprise
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Configurez vos informations légales, vos dépôts physiques et les accès de votre équipe.
          </p>
        </div>
      </div>

      {/* ─── Tabs Navigation ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("org")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
            activeTab === "org"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Building className="h-4 w-4" />
          <span>Entreprise & Fiscalité</span>
        </button>

        <button
          onClick={() => setActiveTab("warehouses")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
            activeTab === "warehouses"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Boxes className="h-4 w-4" />
          <span>Dépôts & Magasins</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === "warehouses"
                ? "bg-indigo-500 text-white"
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
            }`}
          >
            {warehouses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
            activeTab === "team"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Équipe & Accès</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === "team"
                ? "bg-indigo-500 text-white"
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
            }`}
          >
            {members.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
            activeTab === "security"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Sécurité & Données</span>
        </button>

        <button
          onClick={() => setActiveTab("billing")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
            activeTab === "billing"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Abonnement & Facturation</span>
        </button>
      </div>

      {/* ─── Tab 1 : Organisation ─────────────────────────────────────────── */}
      {activeTab === "org" && (
        <div className="rounded-xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 max-w-3xl">
          <form onSubmit={handleSaveOrg} className="space-y-5">
            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Profil de l'Établissement
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Ces informations apparaîtront sur vos factures de vente et bons de commande.
              </p>
            </div>

            {saveSuccess && (
              <div className="flex items-center gap-2 p-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Paramètres enregistrés avec succès !</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Raison Sociale / Nom Commercial
                </label>
                <input
                  type="text"
                  value={orgForm.name || org?.name || ""}
                  onChange={(e) =>
                    setOrgForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Devise d'exploitation
                </label>
                <div className="relative">
                  <Coins className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    disabled
                    value={`${orgForm.currency || org?.currency || "XOF"} (Franc CFA)`}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-100/70 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-400 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Pays du Siège
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <select
                    value={orgForm.country || org?.country || "BJ"}
                    onChange={(e) =>
                      setOrgForm((prev) => ({ ...prev, country: e.target.value }))
                    }
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="BJ">Bénin (BJ)</option>
                    <option value="CI">Côte d'Ivoire (CI)</option>
                    <option value="SN">Sénégal (SN)</option>
                    <option value="TG">Togo (TG)</option>
                    <option value="BF">Burkina Faso (BF)</option>
                    <option value="ML">Mali (ML)</option>
                    <option value="NE">Niger (NE)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Fuseau Horaire
                </label>
                <input
                  type="text"
                  disabled
                  value={orgForm.timezone || org?.timezone || "Africa/Porto-Novo"}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-100/70 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Fiscalité & TVA */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5" />
                Régime Fiscal & TVA
              </h4>

              <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Facturation avec TVA
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Applique le taux standard de TVA (18% en zone UEMOA).
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={orgForm.tax_enabled}
                  onChange={(e) =>
                    setOrgForm((prev) => ({
                      ...prev,
                      tax_enabled: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={updateOrg.isPending}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {updateOrg.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sauvegarde...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Enregistrer les modifications</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Tab 2 : Dépôts & Magasins ────────────────────────────────────── */}
      {activeTab === "warehouses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Emplacements physiques ({warehouses.length})
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Chaque dépôt possède son propre stock physique et ses mouvements d'inventaire.
              </p>
            </div>
            <button
              onClick={() => setNewWarehouseOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Dépôt</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map((wh) => (
              <div
                key={wh.id}
                className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {wh.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        wh.is_active
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {wh.is_active ? "Actif" : "Inactif"}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>{wh.name}</span>
                  </h4>

                  <div className="space-y-1 text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span>
                        {wh.address ? `${wh.address}, ${wh.city}` : wh.city}
                      </span>
                    </div>
                    {wh.manager_name && (
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span>Resp: {wh.manager_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() =>
                      toggleWarehouse.mutate({
                        id: wh.id,
                        is_active: !wh.is_active,
                      })
                    }
                    className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-[11px] underline"
                  >
                    {wh.is_active ? "Désactiver" : "Réactiver"}
                  </button>
                  <span className="text-[11px] text-zinc-400">Stock isolé</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Tab 3 : Équipe & Permissions ─────────────────────────────────── */}
      {activeTab === "team" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Collaborateurs & Rôles ({members.length})
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Assignez des accès à vos gestionnaires de stock et caissiers.
              </p>
            </div>
            <button
              onClick={() => setInviteMemberOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Inviter un collaborateur</span>
            </button>
          </div>

          <div className="rounded-xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/75 dark:border-zinc-800 dark:bg-zinc-800/40 text-zinc-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Collaborateur</th>
                    <th className="py-3 px-4">Rôle</th>
                    <th className="py-3 px-4">Téléphone</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {members.map((mem) => (
                    <tr key={mem.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                            {mem.user?.first_name?.[0] || mem.user?.email?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {mem.user?.full_name || mem.user?.email || "Utilisateur"}
                            </p>
                            <p className="text-[11px] text-zinc-400">
                              {mem.user?.email || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getRoleBadge(
                            mem.role
                          )}`}
                        >
                          {getRoleLabel(mem.role)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-zinc-500">
                        {mem.user?.phone || "—"}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            mem.is_active
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                          }`}
                        >
                          {mem.is_active ? "Actif" : "Suspendu"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {mem.role !== "OWNER" && (
                          <button
                            onClick={() =>
                              toggleMember.mutate({
                                id: mem.id,
                                is_active: !mem.is_active,
                              })
                            }
                            className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 underline"
                          >
                            {mem.is_active ? "Désactiver" : "Activer"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab 4 : Sécurité & Données ───────────────────────────────────── */}
      {activeTab === "security" && (
        <div className="rounded-xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 max-w-2xl space-y-6">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Sécurité & Environnement Docker
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              STOCKPRO s'exécute dans des conteneurs isolés avec chiffrement Argon2.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Algorithme de hachage
                </p>
                <p className="text-zinc-400 text-[11px]">
                  Argon2PasswordHasher (Recommandation OWASP)
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                ACTIF
              </span>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Base de données relationnelle
                </p>
                <p className="text-zinc-400 text-[11px]">
                  PostgreSQL 16 Multi-tenant (Volume stockpro_pgdata)
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                CONNECTED
              </span>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Isolation des données
                </p>
                <p className="text-zinc-400 text-[11px]">
                  Filtrage strict par Organisation ID sur toutes les requêtes SQL
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                ENFORCED
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab 5 : Facturation & Abonnement AlphaPay ──────────────────── */}
      {activeTab === "billing" && <SubscriptionSection />}

      {/* ─── Modales & Fiches ─────────────────────────────────────────────── */}
      <NewWarehouseSheet
        open={newWarehouseOpen}
        onOpenChange={setNewWarehouseOpen}
      />
      <InviteMemberSheet
        open={inviteMemberOpen}
        onOpenChange={setInviteMemberOpen}
      />
    </div>
  );
}
