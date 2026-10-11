"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import apiClient, { getApiErrorMessage } from "@/lib/api/client";
import {
  AuthAlert,
  AuthCard,
  AuthField,
  AuthLoading,
  AuthSubmit,
} from "@/components/auth/AuthCard";

// Étape 1 (sans paramètres) : demande du lien par email.
function RequestLinkForm() {
  const [email, setEmail] = useState("");
  const request = useMutation({
    mutationFn: () => apiClient.post("/auth/password/forgot/", { email }),
  });

  if (request.isSuccess) {
    return (
      <AuthCard title="Vérifiez vos emails">
        <AuthAlert variant="success">
          Si un compte existe pour {email}, un lien de réinitialisation vient d&apos;être envoyé.
          Il est valable quelques jours et ne fonctionne qu&apos;une fois.
        </AuthAlert>
        <Link href="/login" className="text-center text-sm text-indigo-400 hover:text-indigo-300">
          Retour à la connexion
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Mot de passe oublié"
      subtitle="Recevez par email un lien pour choisir un nouveau mot de passe"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          request.mutate();
        }}
        className="flex flex-col gap-5"
      >
        {request.isError && (
          <AuthAlert variant="error">
            {getApiErrorMessage(request.error, "Envoi impossible. Réessayez dans quelques minutes.")}
          </AuthAlert>
        )}
        <AuthField
          id="email"
          label="Adresse email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
        />
        <AuthSubmit pending={request.isPending} pendingLabel="Envoi…">
          Envoyer le lien
        </AuthSubmit>
        <Link href="/login" className="text-center text-sm text-zinc-500 hover:text-zinc-300">
          Retour à la connexion
        </Link>
      </form>
    </AuthCard>
  );
}

// Étape 2 (lien reçu par email) : choix du nouveau mot de passe.
function NewPasswordForm({ uid, token }: { uid: string; token: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const reset = useMutation({
    mutationFn: () => apiClient.post("/auth/password/reset/", { uid, token, password }),
  });

  if (reset.isSuccess) {
    return (
      <AuthCard title="Mot de passe modifié">
        <AuthAlert variant="success">Vous pouvez maintenant vous connecter.</AuthAlert>
        <Link
          href="/login"
          className="flex h-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Se connecter
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Nouveau mot de passe" subtitle="8 caractères minimum, évitez les mots courants">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setMismatch(password !== confirmation);
          if (password === confirmation) reset.mutate();
        }}
        className="flex flex-col gap-5"
      >
        {mismatch && (
          <AuthAlert variant="error">La confirmation ne correspond pas au mot de passe.</AuthAlert>
        )}
        {reset.isError && (
          <AuthAlert variant="error">
            {getApiErrorMessage(reset.error, "Ce lien est invalide ou a expiré.")}{" "}
            <Link href="/reset-password" className="underline">
              Demander un nouveau lien
            </Link>
          </AuthAlert>
        )}
        <AuthField
          id="password"
          label="Nouveau mot de passe"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <AuthField
          id="confirmation"
          label="Confirmation"
          type="password"
          autoComplete="new-password"
          required
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />
        <AuthSubmit pending={reset.isPending} pendingLabel="Enregistrement…">
          Enregistrer
        </AuthSubmit>
      </form>
    </AuthCard>
  );
}

function ResetPassword() {
  const params = useSearchParams();
  const uid = params.get("uid");
  const token = params.get("token");
  return uid && token ? <NewPasswordForm uid={uid} token={token} /> : <RequestLinkForm />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <ResetPassword />
    </Suspense>
  );
}
