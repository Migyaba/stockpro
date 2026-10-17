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

// L'inscription n'ouvre pas de session : un lien de confirmation part par email.
export async function register(
  payload: RegisterPayload
): Promise<{ email: string; verification_required: boolean }> {
  const { data } = await apiClient.post<{ email: string; verification_required: boolean }>(
    "/auth/register/",
    payload
  );
  return data;
}

// Confirme l'email (lien reçu) et ouvre la session.
export async function verifyEmail(uid: string, token: string): Promise<AuthTokens & { user: UserProfile }> {
  const { data } = await apiClient.post<AuthTokens & { user: UserProfile }>("/auth/email/verify/", {
    uid,
    token,
  });
  return data;
}

export async function resendVerification(email: string): Promise<void> {
  await apiClient.post("/auth/email/resend/", { email });
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

// ─── Invitations (pages publiques) ─────────────────────────────────────────
export interface InvitationInfo {
  email: string;
  role: Role;
  organization_name: string;
  account_exists: boolean;
  expires_at: string;
}

export async function fetchInvitationInfo(token: string): Promise<InvitationInfo> {
  const { data } = await apiClient.get<InvitationInfo>("/auth/invitations/info/", {
    params: { token },
  });
  return data;
}

export async function acceptInvitation(payload: {
  token: string;
  password: string;
  first_name?: string;
  last_name?: string;
}): Promise<AuthTokens> {
  const { data } = await apiClient.post<AuthTokens>("/auth/invitations/accept/", payload);
  return data;
}
