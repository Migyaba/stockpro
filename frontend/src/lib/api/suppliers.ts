import apiClient from "@/lib/api/client";
import type {
  Supplier,
  CreateSupplierPayload,
  PaginatedResponse,
} from "@/lib/types/api";

const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: "sup-001",
    name: "Grands Moulins de Dakar (GMD)",
    contact_name: "Babacar Diop",
    email: "commandes@gmd-senegal.com",
    phone: "+221 33 839 20 00",
    address: "Km 4, Boulevard du Centenaire de la Commune de Dakar",
    city: "Dakar",
    country: "SN",
    notes: "Fournisseur principal de farine et céréales",
    is_active: true,
    created_at: "2026-01-10T10:00:00Z",
  },
  {
    id: "sup-002",
    name: "Sedar Agro & Huiles Abidjan",
    contact_name: "Kouamé N'Guessan",
    email: "ventes@sedar-agro.ci",
    phone: "+225 27 21 35 44 00",
    address: "Zone Industrielle de Yopougon, Rue des Huileries",
    city: "Abidjan",
    country: "CI",
    notes: "Huiles de palme et végétales raffinées en gros",
    is_active: true,
    created_at: "2026-01-12T14:30:00Z",
  },
  {
    id: "sup-003",
    name: "Société des Brasseries et Boissons du Bénin",
    contact_name: "Chantal Mensah",
    email: "distribution@sobebra.bj",
    phone: "+229 21 33 11 22",
    address: "Zone Portuaire, Akpakpa",
    city: "Cotonou",
    country: "BJ",
    notes: "Livrable sous 48h, règlement à 30 jours",
    is_active: true,
    created_at: "2026-02-01T09:15:00Z",
  },
  {
    id: "sup-004",
    name: "Sahel Import-Export Logistique",
    contact_name: "Oumarou Garba",
    email: "contact@sahel-logistics.ne",
    phone: "+227 20 73 88 90",
    address: "Boulevard Mali Béro",
    city: "Niamey",
    country: "NE",
    notes: "Importateur de conserves, pâtes et produits laitiers",
    is_active: true,
    created_at: "2026-02-15T11:00:00Z",
  },
];

let mockSuppliers: Supplier[] = [...MOCK_SUPPLIERS];

export async function fetchSuppliers(filters?: {
  search?: string;
  is_active?: boolean;
}): Promise<Supplier[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.is_active !== undefined)
      params.set("is_active", String(filters.is_active));
    params.set("page_size", "100");

    const { data } = await apiClient.get<
      PaginatedResponse<Supplier> | Supplier[]
    >(`/suppliers/?${params.toString()}`);

    if (Array.isArray(data)) return data;
    if ("results" in data && Array.isArray(data.results)) return data.results;
    return mockSuppliers;
  } catch {
    return mockSuppliers;
  }
}

export async function createSupplier(
  payload: CreateSupplierPayload
): Promise<Supplier> {
  try {
    const { data } = await apiClient.post<Supplier>("/suppliers/", payload);
    return data;
  } catch (error) {
    console.warn("Backend /suppliers/ offline, creating simulated supplier", error);
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: payload.name,
      contact_name: payload.contact_name || "",
      email: payload.email || "",
      phone: payload.phone || "",
      address: payload.address || "",
      city: payload.city || "Abidjan",
      country: payload.country || "CI",
      notes: payload.notes || "",
      is_active: true,
      created_at: new Date().toISOString(),
    };
    mockSuppliers.unshift(newSup);
    return newSup;
  }
}
