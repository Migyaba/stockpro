"use client";

import { useBootstrap } from "@/lib/hooks/useAuth";

/**
 * Calls useBootstrap which fires React Query fetches to hydrate
 * the Zustand auth store (user profile, membership, warehouses)
 * whenever an accessToken is present in the store.
 *
 * Must be rendered inside QueryClientProvider.
 */
export function BootstrapProvider({ children }: { children: React.ReactNode }) {
  useBootstrap();
  return <>{children}</>;
}
