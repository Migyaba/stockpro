import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * false pendant le rendu serveur et l'hydratation, true ensuite.
 * Le store d'auth est réhydraté depuis localStorage : tout ce qui en dépend
 * doit attendre ce signal pour ne pas diverger du HTML rendu côté serveur.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
