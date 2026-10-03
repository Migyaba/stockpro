import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserProfile, Membership, Organization, Warehouse, Role } from "@/lib/types/api";

// Sync access token to a cookie readable by Next.js middleware
function syncCookie(token: string | null) {
  if (typeof document === "undefined") return;
  if (token) {
    // SameSite=Strict; no HttpOnly so JS can write it
    // For production, prefer server-side Set-Cookie via an API route
    document.cookie = `sp_access=${token}; path=/; SameSite=Strict; max-age=1800`;
  } else {
    document.cookie = "sp_access=; path=/; max-age=0";
  }
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
}

function derivePermissions(role: Role | null) {
  return {
    canViewCost: role !== "STAFF",
    canCancelSale: role === "OWNER" || role === "ADMINISTRATOR",
    canInviteUsers: role === "OWNER" || role === "ADMINISTRATOR",
    canManageBilling: role === "OWNER",
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
      canViewCost: false,
      canCancelSale: false,
      canInviteUsers: false,
      canManageBilling: false,

      setTokens: (access, refresh) => {
        syncCookie(access);
        set({ accessToken: access, refreshToken: refresh });
      },

      setUser: (user) => set({ user }),

      setMembership: (membership) => {
        const role = membership.role;
        set({
          membership,
          organization: membership.organization,
          role,
          ...derivePermissions(role),
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
        syncCookie(null);
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          membership: null,
          organization: null,
          activeWarehouse: null,
          warehouses: [],
          role: null,
          canViewCost: false,
          canCancelSale: false,
          canInviteUsers: false,
          canManageBilling: false,
        });
      },
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
      }),
    }
  )
);
