"use client";

import { Loader2 } from "lucide-react";
import { useResendVerification } from "@/lib/hooks/useAuth";

// Renvoi du lien de confirmation (réponse identique que le compte existe ou non).
export function ResendVerification({ email }: { email: string }) {
  const resend = useResendVerification();

  if (resend.isSuccess) {
    return <p className="text-center text-sm text-emerald-400">Nouveau lien envoyé à {email}.</p>;
  }

  return (
    <button
      type="button"
      onClick={() => resend.mutate(email)}
      disabled={resend.isPending || !email}
      className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-60"
    >
      {resend.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
      Renvoyer le lien de confirmation
    </button>
  );
}
