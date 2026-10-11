"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";
import { requiredPermission } from "@/lib/permissions";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SubscriptionBanner } from "@/components/layout/SubscriptionBanner";

// Affiche un écran explicite plutôt qu'une page vide pleine d'erreurs 403.
function PermissionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { membership, permissions } = useAuthStore();
  const code = requiredPermission(pathname);

  if (!code) return <>{children}</>;
  if (!membership) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }
  if (!permissions.includes(code)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <ShieldAlert className="h-10 w-10 text-zinc-400" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Accès non autorisé</h2>
        <p className="max-w-sm text-sm text-zinc-500">
          Votre rôle ne permet pas d&apos;accéder à cette page. Contactez le responsable de votre
          organisation si vous en avez besoin.
        </p>
        <Link href="/ventes" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Retour aux ventes
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const hydrated = useHydrated();

  // Zone connectée rendue côté client uniquement (session lue dans localStorage).
  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <SubscriptionBanner />
        <main className="flex-1 overflow-y-auto">
          <PermissionGate>{children}</PermissionGate>
        </main>
      </div>
    </div>
  );
}
