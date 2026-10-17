"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  login,
  register,
  logout,
  fetchMe,
  fetchMyMembership,
  fetchMyWarehouses,
  acceptInvitation,
  verifyEmail,
  resendVerification,
} from "@/lib/api/auth";
import type { LoginPayload, RegisterPayload } from "@/lib/types/api";

// ─── Bootstrap: load user + membership after login ────────────────────────
export function useBootstrap() {
  const { accessToken, setUser, setMembership, setWarehouses } =
    useAuthStore();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    enabled: !!accessToken,
    staleTime: 5 * 60_000,
  });

  const membershipQuery = useQuery({
    queryKey: ["auth", "membership"],
    queryFn: fetchMyMembership,
    enabled: !!accessToken,
    staleTime: 5 * 60_000,
  });

  const warehousesQuery = useQuery({
    queryKey: ["auth", "warehouses"],
    queryFn: fetchMyWarehouses,
    enabled: !!accessToken,
    staleTime: 5 * 60_000,
  });

  // Sync to store when data arrives
  useEffect(() => { if (meQuery.data) setUser(meQuery.data); }, [meQuery.data, setUser]);
  useEffect(() => { if (membershipQuery.data) setMembership(membershipQuery.data); }, [membershipQuery.data, setMembership]);
  useEffect(() => { if (warehousesQuery.data) setWarehouses(warehousesQuery.data); }, [warehousesQuery.data, setWarehouses]);

  return {
    loading:
      meQuery.isLoading ||
      membershipQuery.isLoading ||
      warehousesQuery.isLoading,
    error: meQuery.error || membershipQuery.error,
  };
}

// N'accepte que des chemins internes (« /ventes »). Les navigateurs lisent
// « \ » comme « / » : « /\site.com » deviendrait « //site.com », d'où la
// vérification de l'origine après résolution.
function safeRedirect(target?: string | null): string {
  if (!target || !target.startsWith("/") || target.includes("\\")) return "/dashboard";
  try {
    const url = new URL(target, window.location.origin);
    if (url.origin !== window.location.origin) return "/dashboard";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/dashboard";
  }
}

// ─── Login mutation ────────────────────────────────────────────────────────
export function useLogin() {
  const { setTokens } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password, organization_id }: LoginPayload & { redirectTo?: string }) =>
      login({ email, password, organization_id }),
    onSuccess: (tokens, { redirectTo }) => {
      setTokens(tokens.access, tokens.refresh);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      router.push(safeRedirect(redirectTo));
    },
  });
}

// ─── Acceptation d'invitation : ouvre une session sur la nouvelle organisation ─
export function useAcceptInvitation() {
  const { setTokens, logout: clearStore } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: acceptInvitation,
    onSuccess: (tokens) => {
      // Une éventuelle session précédente (autre organisation) est remplacée.
      clearStore();
      queryClient.clear();
      setTokens(tokens.access, tokens.refresh);
      router.push("/dashboard");
    },
  });
}

// ─── Register mutation ─────────────────────────────────────────────────────
// Pas de session à l'inscription : la page affiche « vérifiez votre email ».
export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
  });
}

// Lien de confirmation : ouvre la session puis mène au tableau de bord.
export function useVerifyEmail() {
  const { setTokens, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ uid, token }: { uid: string; token: string }) => verifyEmail(uid, token),
    onSuccess: (data) => {
      setTokens(data.access, data.refresh);
      if (data.user) setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      router.replace("/dashboard");
    },
  });
}

export function useResendVerification() {
  return useMutation({ mutationFn: (email: string) => resendVerification(email) });
}

// ─── Logout mutation ───────────────────────────────────────────────────────
export function useLogout() {
  const { refreshToken, logout: clearStore } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () =>
      refreshToken ? logout(refreshToken) : Promise.resolve(),
    onSettled: () => {
      clearStore();
      queryClient.clear();
      router.push("/login");
    },
  });
}
