"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/api/client";
import { fetchInvitationInfo } from "@/lib/api/auth";
import { useAcceptInvitation } from "@/lib/hooks/useAuth";
import type { Role } from "@/lib/types/api";
import {
  AuthAlert,
  AuthCard,
  AuthField,
  AuthLoading,
  AuthSubmit,
} from "@/components/auth/AuthCard";

const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Propriétaire",
  ADMINISTRATOR: "Administrateur",
  MANAGER: "Manager",
  STAFF: "Vendeur",
};

function AcceptInvitation({ token }: { token: string }) {
  const info = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => fetchInvitationInfo(token),
    retry: false,
  });
  const accept = useAcceptInvitation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");

  if (info.isLoading) return <AuthLoading />;
  if (info.isError || !info.data) {
    return (
      <AuthCard title="Invitation indisponible">
        <AuthAlert variant="error">
          {getApiErrorMessage(info.error, "Cette invitation est invalide ou a expiré.")}
        </AuthAlert>
        <p className="text-sm text-zinc-400">
          Demandez au responsable de votre organisation de vous renvoyer une invitation.
        </p>
      </AuthCard>
    );
  }

  const invitation = info.data;
  return (
    <AuthCard
      title={`Rejoindre ${invitation.organization_name}`}
      subtitle={`Vous êtes invité(e) en tant que ${ROLE_LABELS[invitation.role] ?? invitation.role}`}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          accept.mutate({
            token,
            password,
            ...(invitation.account_exists ? {} : { first_name: firstName, last_name: lastName }),
          });
        }}
        className="flex flex-col gap-5"
      >
        {accept.isError && (
          <AuthAlert variant="error">
            {getApiErrorMessage(accept.error, "Impossible d'accepter l'invitation.")}
          </AuthAlert>
        )}

        <AuthField id="email" label="Adresse email" type="email" value={invitation.email} disabled readOnly />

        {invitation.account_exists ? (
          <>
            <p className="text-sm text-zinc-400">
              Un compte STOCKPRO existe déjà pour cette adresse. Confirmez avec son mot de passe.
            </p>
            <AuthField
              id="password"
              label="Mot de passe de votre compte"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Link href="/reset-password" className="-mt-3 text-xs text-indigo-400 hover:text-indigo-300">
              Mot de passe oublié ?
            </Link>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <AuthField
                id="first_name"
                label="Prénom"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <AuthField
                id="last_name"
                label="Nom"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <AuthField
              id="password"
              label="Choisissez un mot de passe (8 caractères minimum)"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </>
        )}

        <AuthSubmit pending={accept.isPending} pendingLabel="Connexion…">
          Accepter et rejoindre
        </AuthSubmit>
      </form>
    </AuthCard>
  );
}

function InvitationContent() {
  const token = useSearchParams().get("token");
  if (!token) {
    return (
      <AuthCard title="Lien incomplet">
        <AuthAlert variant="error">Ce lien d&apos;invitation ne contient pas de jeton.</AuthAlert>
      </AuthCard>
    );
  }
  return <AcceptInvitation token={token} />;
}

export default function InvitationPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <InvitationContent />
    </Suspense>
  );
}
