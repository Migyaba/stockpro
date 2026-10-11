import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserProfile, Membership, Organization, Warehouse, Role } from "@/lib/types/api";

// Marqueur de session lisible par le middleware Next.js. Il vit aussi longtemps
// que le refresh token (14 jours) : l'access token (30 min) est renouvelé à la
// volée par l'intercepteur axios, l'inactivité ne doit donc pas déconnecter.
const SESSION_COOKIE = "sp_session";
const SESSION_MAX_AGE = 14 * 24 * 60 * 60;

function syncSessionCookie(active: boolean) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = active
    ? `${SESSION_COOKIE}=1; path=/; SameSite=Lax; max-age=${SESSION_MAX_AGE}${secure}`
    : `${SESSION_COOKIE}=; path=/; max-age=0`;
  // Nettoyage de l'ancien cookie qui contenait le jeton d'accès.
  document.cookie = "sp_access=; path=/; max-age=0";
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  membership: Membership | null;
  organization: Organization | null;
  activeWarehouse: Warehouse | null;
  warehouses: Warehouse[];

  // Computed helpers
  role: Role | null;
  permissions: string[];
  canViewCost: boolean;
  canCancelSale: boolean;
  canInviteUsers: boolean;
  canManageBilling: boolean;

  // Actions
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: UserProfile) => void;
  setMembership: (membership: Membership) => void;
  setWarehouses: (warehouses: Warehouse[]) => void;
  setActiveWarehouse: (warehouse: Warehouse) => void;
  logout: () => void;
  hasPermission: (code: string) => boolean;
}

function derivePermissions(permissions: string[]) {
  return {
    canViewCost: permissions.includes("prices.view_cost"),
    canCancelSale: permissions.includes("sales.cancel"),
    canInviteUsers: permissions.includes("users.invite"),
    canManageBilling: permissions.includes("billing.manage"),
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      membership: null,
      organization: null,
      activeWarehouse: null,
      warehouses: [],
      role: null,
      permissions: [],
      canViewCost: false,
      canCancelSale: false,
      canInviteUsers: false,
      canManageBilling: false,

      setTokens: (access, refresh) => {
        syncSessionCookie(true);
        set({ accessToken: access, refreshToken: refresh });
      },

      setUser: (user) => set({ user }),

      setMembership: (membership) => {
        const permissions = membership.permissions ?? [];
        set({
          membership,
          organization: membership.organization,
          role: membership.role,
          permissions,
          ...derivePermissions(permissions),
        });
      },

      setWarehouses: (warehouses) => {
        const current = get().activeWarehouse;
        const stillExists = current
          ? warehouses.some((w) => w.id === current.id)
          : false;
        set({
          warehouses,
          activeWarehouse:
            stillExists ? current : (warehouses[0] ?? null),
        });
      },

      setActiveWarehouse: (warehouse) => set({ activeWarehouse: warehouse }),

      logout: () => {
        syncSessionCookie(false);
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          membership: null,
          organization: null,
          activeWarehouse: null,
          warehouses: [],
          role: null,
          permissions: [],
          canViewCost: false,
          canCancelSale: false,
          canInviteUsers: false,
          canManageBilling: false,
        });
      },

      hasPermission: (code) => get().permissions.includes(code),
    }),
    {
      name: "stockpro-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        membership: state.membership,
        organization: state.organization,
        activeWarehouse: state.activeWarehouse,
        warehouses: state.warehouses,
        role: state.role,
        permissions: state.permissions,
        canViewCost: state.canViewCost,
        canCancelSale: state.canCancelSale,
        canInviteUsers: state.canInviteUsers,
        canManageBilling: state.canManageBilling,
      }),
    }
  )
);
