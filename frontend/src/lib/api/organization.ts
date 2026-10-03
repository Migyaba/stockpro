import apiClient from "@/lib/api/client";
import type {
  Organization,
  OrganizationMember,
  InviteMemberPayload,
  PaginatedResponse,
} from "@/lib/types/api";

export async function fetchOrganizationProfile(): Promise<Organization> {
  const { data } = await apiClient.get<Organization>("/organizations/me/");
  return data;
}

export async function updateOrganizationProfile(
  payload: Partial<Organization>
): Promise<Organization> {
  const { data } = await apiClient.patch<Organization>(
    "/organizations/me/",
    payload
  );
  return data;
}

function normalizeMember(m: any): OrganizationMember {
  const user = m.user || {
    id: String(m.id || ""),
    email: m.email || "",
    first_name: m.first_name || "",
    last_name: m.last_name || "",
    phone: m.phone || "",
    full_name: `${m.first_name || ""} ${m.last_name || ""}`.trim() || m.email || "Utilisateur",
  };
  return {
    id: m.id,
    user,
    role: m.role || "STAFF",
    is_active: m.is_active ?? true,
    created_at: m.created_at || new Date().toISOString(),
    warehouse_ids: m.warehouse_ids || [],
  };
}

export async function fetchOrganizationMembers(): Promise<OrganizationMember[]> {
  const { data } = await apiClient.get<
    PaginatedResponse<any> | any[]
  >("/users/?page_size=100");

  let rawList: any[] = [];
  if (Array.isArray(data)) {
    rawList = data;
  } else if (data && "results" in data && Array.isArray(data.results)) {
    rawList = data.results;
  }
  return rawList.map(normalizeMember);
}

export async function inviteOrganizationMember(
  payload: InviteMemberPayload
): Promise<void> {
  await apiClient.post("/invitations/", payload);
}

export async function updateMemberRole(
  id: number | string,
  role: OrganizationMember["role"]
): Promise<void> {
  await apiClient.patch(`/users/${id}/`, { role });
}

export async function toggleMemberActive(
  id: number | string,
  is_active: boolean
): Promise<void> {
  await apiClient.patch(`/users/${id}/`, { is_active });
}
