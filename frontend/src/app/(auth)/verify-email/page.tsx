"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getApiErrorMessage } from "@/lib/api/client";
import { useVerifyEmail } from "@/lib/hooks/useAuth";
import { AuthAlert, AuthCard, AuthLoading } from "@/components/auth/AuthCard";

function VerifyEmail() {
  const params = useSearchParams();
  const uid = params.get("uid") ?? "";
  const token = params.get("token") ?? "";
  const verify = useVerifyEmail();
  // Le lien ne sert qu'une fois : pas de second appel (double montage en dev).
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !uid || !token) return;
    started.current = true;
    verify.mutate({ uid, token });
  }, [uid, token, verify]);

  if (!uid || !token || verify.isError) {
    return (
      <AuthCard title="Lien invalide">
        <AuthAlert variant="error">
          {verify.isError
            ? getApiErrorMessage(verify.error, "Ce lien est invalide ou a expiré.")
            : "Ce lien est incomplet."}{" "}
          Connectez-vous pour en recevoir un nouveau.
        </AuthAlert>
        <Link href="/login" className="text-center text-sm text-indigo-400 hover:text-indigo-300">
          Aller à la connexion
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Confirmation de votre email" subtitle="Activation de votre compte en cours…">
      <AuthLoading />
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <VerifyEmail />
    </Suspense>
  );
}
