import apiClient from "@/lib/api/client";
import type {
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  UserProfile,
  Membership,
  Warehouse,
  Role,
} from "@/lib/types/api";

// ─── Auth endpoints ────────────────────────────────────────────────────────
export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const { data } = await apiClient.post<AuthTokens>("/auth/login/", payload);
  return data;
}

export async function register(
  payload: RegisterPayload
): Promise<AuthTokens & { user: UserProfile }> {
  const { data } = await apiClient.post<AuthTokens & { user: UserProfile }>(
    "/auth/register/",
    payload
  );
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post("/auth/logout/", { refresh: refreshToken });
}

// ─── Profile & membership ──────────────────────────────────────────────────
export async function fetchMe(): Promise<UserProfile> {
  const { data } = await apiClient.get<{
    user?: UserProfile;
    membership?: { role?: Role };
  } & UserProfile>("/auth/me/");
  if (data.user) {
    return {
      ...data.user,
      role: data.membership?.role ?? data.user.role,
    };
  }
  return data;
}

export async function fetchMyMembership(): Promise<Membership> {
  const { data } = await apiClient.get<Membership>("/auth/membership/");
  return data;
}

export async function fetchMyWarehouses(): Promise<Warehouse[]> {
  const { data } = await apiClient.get<{ results: Warehouse[] }>(
    "/warehouses/?page_size=100"
  );
  return data.results;
}
