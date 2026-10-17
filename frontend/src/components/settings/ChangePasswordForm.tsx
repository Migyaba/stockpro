"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, Loader2 } from "lucide-react";
import apiClient, { getApiErrorMessage } from "@/lib/api/client";
import { toast } from "@/lib/stores/toastStore";
import { useAuthStore } from "@/lib/stores/authStore";

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800";

export function ChangePasswordForm() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const setTokens = useAuthStore((s) => s.setTokens);

  // Le serveur invalide tous les jetons existants et renvoie un nouveau couple
  // pour cette session : sans lui, la requête suivante serait refusée.
  const change = useMutation({
    mutationFn: () =>
      apiClient
        .post<{ access: string; refresh: string }>("/auth/password/change/", {
          old_password: oldPassword,
          new_password: newPassword,
        })
        .then((res) => res.data),
    onSuccess: (data) => setTokens(data.access, data.refresh),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmation) {
      setError("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }
    try {
      await change.mutateAsync();
      setOldPassword("");
      setNewPassword("");
      setConfirmation("");
      toast.success("Mot de passe modifié.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de modifier le mot de passe."));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Mot de passe</h3>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="block space-y-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          <span>Mot de passe actuel</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className={INPUT_CLASS}
          />
        </label>
        <label className="block space-y-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          <span>Nouveau mot de passe (8 caractères minimum)</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={INPUT_CLASS}
          />
        </label>
        <label className="block space-y-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          <span>Confirmation</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={change.isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {change.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Modifier le mot de passe
      </button>
    </form>
  );
}
