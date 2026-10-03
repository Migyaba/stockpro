import apiClient from "@/lib/api/client";
import type {
  Customer,
  CreateCustomerPayload,
  PaginatedResponse,
} from "@/lib/types/api";

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "cust-001",
    name: "Établissements Maman Kofo & Fils",
    phone: "+229 97 12 34 56",
    email: "mamankofo@gmail.com",
    address: "Rue du Grand Marché Dantokpa, Hangar 4B",
    city: "Cotonou",
    notes: "Demi-grossiste alimentaire. Bon payeur, livraisons le mardi matin.",
    is_active: true,
    created_at: "2026-01-15T08:30:00Z",
  },
  {
    id: "cust-002",
    name: "Alimentation Générale de la Paix",
    phone: "+225 07 48 99 22 10",
    email: "agpaix.abidjan@yahoo.fr",
    address: "Boulevard Nangui Abrogoua, Adjamé",
    city: "Abidjan",
    notes: "Magasin de proximité avec fort débit de produits laitiers et boissons.",
    is_active: true,
    created_at: "2026-01-20T11:00:00Z",
  },
  {
    id: "cust-003",
    name: "Superette Étoile Brillante",
    phone: "+221 77 654 32 10",
    email: "contact@etoilebrillante.sn",
    address: "Avenue Blaise Diagne, Médina",
    city: "Dakar",
    notes: "Règlement par virement / chèque à 15 jours.",
    is_active: true,
    created_at: "2026-02-05T14:20:00Z",
  },
  {
    id: "cust-004",
    name: "Quincaillerie Moderne & BTP Calavi",
    phone: "+229 95 88 77 66",
    email: "calavi.quincaillerie@gmail.com",
    address: "Carrefour Kpota, RNIE 2",
    city: "Abomey-Calavi",
    notes: "Achats récurrents de sacs de ciment et fer à béton.",
    is_active: true,
    created_at: "2026-02-18T16:45:00Z",
  },
  {
    id: "cust-005",
    name: "Dépôt Express Kodjoviakopé",
    phone: "+228 90 23 45 67",
    email: "kodjoviakope.depot@tg.com",
    address: "Boulevard Circulaire",
    city: "Lomé",
    notes: "Commandes de gros volumes de riz et conserves.",
    is_active: true,
    created_at: "2026-03-01T09:10:00Z",
  },
];

let mockCustomers: Customer[] = [...MOCK_CUSTOMERS];

export async function fetchCustomers(filters?: {
  search?: string;
  is_active?: boolean;
}): Promise<Customer[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.is_active !== undefined)
      params.set("is_active", String(filters.is_active));
    params.set("page_size", "100");

    const { data } = await apiClient.get<
      PaginatedResponse<Customer> | Customer[]
    >(`/customers/?${params.toString()}`);

    if (Array.isArray(data)) return data;
    if ("results" in data && Array.isArray(data.results)) return data.results;
    return mockCustomers;
  } catch {
    let list = [...mockCustomers];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q) ||
          c.phone?.includes(q)
      );
    }
    return list;
  }
}

export async function createCustomer(
  payload: CreateCustomerPayload
): Promise<Customer> {
  try {
    const { data } = await apiClient.post<Customer>("/customers/", payload);
    return data;
  } catch (error) {
    console.warn("Backend /customers/ offline, creating simulated customer", error);
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: payload.name,
      phone: payload.phone || "",
      email: payload.email || "",
      address: payload.address || "",
      city: payload.city || "Cotonou",
      notes: payload.notes || "",
      is_active: true,
      created_at: new Date().toISOString(),
    };
    mockCustomers.unshift(newCust);
    return newCust;
  }
}

export async function updateCustomer(
  id: string,
  payload: Partial<CreateCustomerPayload>
): Promise<Customer> {
  try {
    const { data } = await apiClient.patch<Customer>(`/customers/${id}/`, payload);
    return data;
  } catch (error) {
    console.warn("Backend /customers/ offline, updating simulated customer", error);
    const idx = mockCustomers.findIndex((c) => c.id === id);
    if (idx !== -1) {
      mockCustomers[idx] = { ...mockCustomers[idx], ...payload };
      return mockCustomers[idx];
    }
    throw error;
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  try {
    await apiClient.delete(`/customers/${id}/`);
  } catch (error) {
    console.warn("Backend /customers/ offline, deleting simulated customer", error);
    mockCustomers = mockCustomers.filter((c) => c.id !== id);
  }
}
