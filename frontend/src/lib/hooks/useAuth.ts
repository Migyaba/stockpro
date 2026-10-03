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

// ─── Login mutation ────────────────────────────────────────────────────────
export function useLogin() {
  const { setTokens } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (tokens) => {
      setTokens(tokens.access, tokens.refresh);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      router.push("/dashboard");
    },
  });
}

// ─── Register mutation ─────────────────────────────────────────────────────
export function useRegister() {
  const { setTokens, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
    onSuccess: (data) => {
      setTokens(data.access, data.refresh);
      if (data.user) setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      router.push("/dashboard");
    },
  });
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
