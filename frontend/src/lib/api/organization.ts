import apiClient from "@/lib/api/client";
import type {
  Organization,
  OrganizationMember,
  InviteMemberPayload,
  PaginatedResponse,
} from "@/lib/types/api";

const MOCK_ORG: Organization = {
  id: 1,
  name: "SOCOMAF Distribution Bénin",
  slug: "socomaf-benin",
  logo: null,
  country: "BJ",
  currency: "XOF",
  currency_exponent: 0,
  timezone: "Africa/Porto-Novo",
  language: "fr",
  tax_enabled: true,
  tax_rate_bps: 1800,
  prices_include_tax: true,
  max_discount_percent_manager: 10,
  status: "ACTIVE",
  trial_ends_at: null,
};

const MOCK_MEMBERS: OrganizationMember[] = [
  {
    id: 1,
    user: {
      id: "usr-1",
      email: "direction@socomaf.bj",
      first_name: "Miguel",
      last_name: "Misse",
      phone: "+229 97 00 11 22",
      full_name: "Miguel Misse",
    },
    role: "OWNER",
    is_active: true,
    created_at: "2026-01-01T10:00:00Z",
  },
  {
    id: 2,
    user: {
      id: "usr-2",
      email: "gestion.stocks@socomaf.bj",
      first_name: "Alain",
      last_name: "Gbaguidi",
      phone: "+229 96 33 44 55",
      full_name: "Alain Gbaguidi",
    },
    role: "MANAGER",
    is_active: true,
    created_at: "2026-01-10T14:30:00Z",
  },
  {
    id: 3,
    user: {
      id: "usr-3",
      email: "caisse.dantokpa@socomaf.bj",
      first_name: "Mireille",
      last_name: "Houessou",
      phone: "+229 95 66 77 88",
      full_name: "Mireille Houessou",
    },
    role: "STAFF",
    is_active: true,
    created_at: "2026-02-01T09:00:00Z",
  },
];

let mockOrg: Organization = { ...MOCK_ORG };
let mockMembers: OrganizationMember[] = [...MOCK_MEMBERS];

export async function fetchOrganizationProfile(): Promise<Organization> {
  try {
    const { data } = await apiClient.get<Organization>("/organizations/me/");
    return data;
  } catch {
    return mockOrg;
  }
}

export async function updateOrganizationProfile(
  payload: Partial<Organization>
): Promise<Organization> {
  try {
    const { data } = await apiClient.patch<Organization>(
      "/organizations/me/",
      payload
    );
    return data;
  } catch (error) {
    console.warn("Backend /organizations/me/ offline, updating simulated org", error);
    mockOrg = { ...mockOrg, ...payload };
    return mockOrg;
  }
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
  try {
    const { data } = await apiClient.get<
      PaginatedResponse<any> | any[]
    >("/users/");

    let rawList: any[] = [];
    if (Array.isArray(data)) {
      rawList = data;
    } else if (data && "results" in data && Array.isArray(data.results)) {
      rawList = data.results;
    } else {
      return mockMembers;
    }
    return rawList.map(normalizeMember);
  } catch {
    return mockMembers;
  }
}

export async function inviteOrganizationMember(
  payload: InviteMemberPayload
): Promise<void> {
  try {
    await apiClient.post("/invitations/", payload);
  } catch (error) {
    console.warn("Backend /invitations/ offline, creating simulated member", error);
    const names = payload.email.split("@")[0].split(".");
    const firstName = names[0] ? names[0].charAt(0).toUpperCase() + names[0].slice(1) : "Nouveau";
    const lastName = names[1] ? names[1].charAt(0).toUpperCase() + names[1].slice(1) : "Membre";

    mockMembers.push({
      id: Date.now(),
      user: {
        id: `usr-${Date.now()}`,
        email: payload.email,
        first_name: firstName,
        last_name: lastName,
        phone: "",
        full_name: `${firstName} ${lastName}`,
      },
      role: payload.role,
      is_active: true,
      created_at: new Date().toISOString(),
      warehouse_ids: payload.warehouse_ids,
    });
  }
}

export async function updateMemberRole(
  id: number,
  role: OrganizationMember["role"]
): Promise<void> {
  try {
    await apiClient.patch(`/users/${id}/`, { role });
  } catch (error) {
    console.warn("Backend /users/ offline, updating simulated member role", error);
    const idx = mockMembers.findIndex((m) => m.id === id);
    if (idx !== -1) {
      mockMembers[idx].role = role;
    }
  }
}

export async function toggleMemberActive(
  id: number,
  is_active: boolean
): Promise<void> {
  try {
    await apiClient.patch(`/users/${id}/`, { is_active });
  } catch (error) {
    console.warn("Backend /users/ offline, toggling simulated member active", error);
    const idx = mockMembers.findIndex((m) => m.id === id);
    if (idx !== -1) {
      mockMembers[idx].is_active = is_active;
    }
  }
}
