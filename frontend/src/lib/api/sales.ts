import apiClient from "@/lib/api/client";
import type {
  Sale,
  SaleStatus,
  PaginatedResponse,
  CreateSalePayload,
  Customer,
  Product,
} from "@/lib/types/api";

export interface SaleFilters {
  page?: number;
  page_size?: number;
  search?: string;
  status?: SaleStatus | "";
  warehouse?: string;
  ordering?: string;
}

// ─── Mock data for local testing when backend is offline ──────────────────
const MOCK_SALES: Sale[] = [
  {
    id: "sale-001",
    reference: "VTE-2026-0042",
    status: "COMPLETED",
    sale_date: "2026-09-21T10:30:00Z",
    warehouse: "wh-dakar-01",
    warehouse_name: "Entrepôt Principal Dakar",
    customer: "cust-001",
    customer_name: "Société Sénégalaise de Distribution (SSD)",
    subtotal: 450000,
    discount: 15000,
    tax: 0,
    total: 435000,
    items: [
      {
        id: "item-1",
        product: "prod-001",
        product_name: "Riz Parfumé 25kg Papillon",
        quantity: 20,
        unit_price: 18500,
        discount: 500,
        tax: 0,
        total: 360000,
      },
      {
        id: "item-2",
        product: "prod-002",
        product_name: "Huile Végétale 5L Dinor",
        quantity: 15,
        unit_price: 6000,
        discount: 0,
        tax: 0,
        total: 90000,
      },
    ],
    created_by: "Amadou Diallo",
    completed_at: "2026-09-21T10:32:15Z",
    created_at: "2026-09-21T10:30:00Z",
  },
  {
    id: "sale-002",
    reference: "VTE-2026-0041",
    status: "DRAFT",
    sale_date: "2026-09-21T09:15:00Z",
    warehouse: "wh-dakar-01",
    warehouse_name: "Entrepôt Principal Dakar",
    customer: null,
    customer_name: "Client Comptoir / Passage",
    subtotal: 125000,
    discount: 0,
    tax: 0,
    total: 125000,
    items: [
      {
        id: "item-3",
        product: "prod-003",
        product_name: "Sucre Raffiné 50kg SOSUCAM",
        quantity: 5,
        unit_price: 25000,
        discount: 0,
        tax: 0,
        total: 125000,
      },
    ],
    created_by: "Fatou Sow",
    completed_at: null,
    created_at: "2026-09-21T09:15:00Z",
  },
  {
    id: "sale-003",
    reference: "VTE-2026-0040",
    status: "COMPLETED",
    sale_date: "2026-09-20T16:45:00Z",
    warehouse: "wh-thies-02",
    warehouse_name: "Dépôt Thiès Ville",
    customer: "cust-002",
    customer_name: "Épicerie Moderne Thiès",
    subtotal: 780000,
    discount: 30000,
    tax: 0,
    total: 750000,
    items: [
      {
        id: "item-4",
        product: "prod-004",
        product_name: "Lait Concentré Sucré 1kg Bonnet Rouge",
        quantity: 60,
        unit_price: 13000,
        discount: 500,
        tax: 0,
        total: 750000,
      },
    ],
    created_by: "Moussa Ba",
    completed_at: "2026-09-20T16:50:00Z",
    created_at: "2026-09-20T16:45:00Z",
  },
  {
    id: "sale-004",
    reference: "VTE-2026-0039",
    status: "CANCELLED",
    sale_date: "2026-09-20T14:20:00Z",
    warehouse: "wh-dakar-01",
    warehouse_name: "Entrepôt Principal Dakar",
    customer: "cust-003",
    customer_name: "Alimentation Générale Touba",
    subtotal: 210000,
    discount: 0,
    tax: 0,
    total: 210000,
    items: [
      {
        id: "item-5",
        product: "prod-001",
        product_name: "Riz Parfumé 25kg Papillon",
        quantity: 10,
        unit_price: 21000,
        discount: 0,
        tax: 0,
        total: 210000,
      },
    ],
    created_by: "Amadou Diallo",
    completed_at: "2026-09-20T14:25:00Z",
    created_at: "2026-09-20T14:20:00Z",
  },
];

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "cust-001",
    name: "Société Sénégalaise de Distribution (SSD)",
    phone: "+221 77 123 45 67",
    email: "contact@ssd-sn.com",
    address: "Km 4, Boulevard du Centenaire",
    city: "Dakar",
  },
  {
    id: "cust-002",
    name: "Épicerie Moderne Thiès",
    phone: "+221 78 987 65 43",
    email: "epicerie.thies@gmail.com",
    address: "Marché Central",
    city: "Thiès",
  },
  {
    id: "cust-003",
    name: "Alimentation Générale Touba",
    phone: "+221 76 555 44 33",
    email: "contact@touba-alim.sn",
    address: "Avenue 28",
    city: "Touba",
  },
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-001",
    name: "Riz Parfumé 25kg Papillon",
    sku: "RIZ-PAF-25",
    barcode: "6040001001",
    category: { id: "cat-1", name: "Céréales & Grains", slug: "cereales" },
    description: "Riz brisé parfumé 1er choix sac 25kg",
    purchase_price: 15500,
    selling_price: 18500,
    minimum_stock: 50,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "prod-002",
    name: "Huile Végétale 5L Dinor",
    sku: "HUI-DIN-05",
    barcode: "6040001002",
    category: { id: "cat-2", name: "Huiles & Condiments", slug: "huiles" },
    description: "Huile raffinée bidon de 5 litres",
    purchase_price: 5100,
    selling_price: 6000,
    minimum_stock: 30,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "prod-003",
    name: "Sucre Raffiné 50kg SOSUCAM",
    sku: "SUC-SOS-50",
    barcode: "6040001003",
    category: { id: "cat-1", name: "Céréales & Grains", slug: "cereales" },
    description: "Sucre blanc cristallisé sac 50kg",
    purchase_price: 21500,
    selling_price: 25000,
    minimum_stock: 20,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "prod-004",
    name: "Lait Concentré Sucré 1kg Bonnet Rouge",
    sku: "LAI-BON-01",
    barcode: "6040001004",
    category: { id: "cat-3", name: "Produits Laitiers", slug: "laitiers" },
    description: "Boîte métal 1kg carton de 12",
    purchase_price: 11000,
    selling_price: 13000,
    minimum_stock: 40,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "prod-005",
    name: "Farine de Blé Supérieure 50kg GMD",
    sku: "FAR-GMD-50",
    barcode: "6040001005",
    category: { id: "cat-1", name: "Céréales & Grains", slug: "cereales" },
    description: "Farine boulangère type 55 sac 50kg",
    purchase_price: 19000,
    selling_price: 22500,
    minimum_stock: 25,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

// In-memory storage for mutations when offline
let localSales = [...MOCK_SALES];

export async function fetchSales(
  filters: SaleFilters = {}
): Promise<PaginatedResponse<Sale>> {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    });
    const { data } = await apiClient.get<PaginatedResponse<Sale>>(
      `/sales/?${params.toString()}`
    );
    return data;
  } catch {
    // Fallback filtered in-memory mock
    let list = [...localSales];
    if (filters.status) {
      list = list.filter((s) => s.status === filters.status);
    }
    if (filters.warehouse) {
      list = list.filter((s) => s.warehouse === filters.warehouse);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.reference.toLowerCase().includes(q) ||
          (s.customer_name && s.customer_name.toLowerCase().includes(q))
      );
    }
    return {
      count: list.length,
      next: null,
      previous: null,
      results: list,
    };
  }
}

export async function fetchSale(id: string): Promise<Sale> {
  try {
    const { data } = await apiClient.get<Sale>(`/sales/${id}/`);
    return data;
  } catch {
    const found = localSales.find((s) => s.id === id);
    if (!found) throw new Error("Vente introuvable");
    return found;
  }
}

export async function createSale(payload: CreateSalePayload): Promise<Sale> {
  try {
    const { data } = await apiClient.post<Sale>("/sales/", payload);
    return data;
  } catch {
    // Construct local mock sale
    const customer = MOCK_CUSTOMERS.find((c) => c.id === payload.customer);
    const enrichedItems = payload.items.map((item, idx) => {
      const prod = MOCK_PRODUCTS.find((p) => p.id === item.product);
      const unit_price = item.unit_price ?? prod?.selling_price ?? 10000;
      const discount = item.discount ?? 0;
      const tax = item.tax ?? 0;
      const total = item.quantity * unit_price - discount + tax;
      return {
        id: `item-${Date.now()}-${idx}`,
        product: item.product,
        product_name: prod?.name ?? "Produit standard",
        quantity: item.quantity,
        unit_price,
        discount,
        tax,
        total,
      };
    });

    const subtotal = enrichedItems.reduce(
      (acc, i) => acc + i.quantity * i.unit_price,
      0
    );
    const discount = enrichedItems.reduce((acc, i) => acc + i.discount, 0);
    const tax = enrichedItems.reduce((acc, i) => acc + i.tax, 0);
    const total = subtotal - discount + tax;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      reference: `VTE-2026-${String(localSales.length + 1).padStart(4, "0")}`,
      status: "DRAFT",
      sale_date: payload.sale_date ?? new Date().toISOString(),
      warehouse: payload.warehouse,
      warehouse_name: "Dépôt actif",
      customer: payload.customer ?? null,
      customer_name: customer ? customer.name : "Client Comptoir / Passage",
      subtotal,
      discount,
      tax,
      total,
      items: enrichedItems,
      created_by: "Utilisateur actif",
      completed_at: null,
      created_at: new Date().toISOString(),
    };

    localSales = [newSale, ...localSales];
    return newSale;
  }
}

export async function completeSale(id: string): Promise<Sale> {
  try {
    const { data } = await apiClient.post<Sale>(`/sales/${id}/complete/`);
    return data;
  } catch {
    localSales = localSales.map((s) =>
      s.id === id
        ? {
            ...s,
            status: "COMPLETED",
            completed_at: new Date().toISOString(),
          }
        : s
    );
    return localSales.find((s) => s.id === id)!;
  }
}

export async function cancelSale(id: string): Promise<Sale> {
  try {
    const { data } = await apiClient.post<Sale>(`/sales/${id}/cancel/`);
    return data;
  } catch {
    localSales = localSales.map((s) =>
      s.id === id
        ? {
            ...s,
            status: "CANCELLED",
          }
        : s
    );
    return localSales.find((s) => s.id === id)!;
  }
}

export async function fetchCustomers(): Promise<Customer[]> {
  try {
    const { data } = await apiClient.get<PaginatedResponse<Customer> | Customer[]>(
      "/customers/"
    );
    return Array.isArray(data) ? data : data.results;
  } catch {
    return MOCK_CUSTOMERS;
  }
}

export async function fetchSaleProducts(): Promise<Product[]> {
  try {
    const { data } = await apiClient.get<PaginatedResponse<Product> | Product[]>(
      "/products/"
    );
    return Array.isArray(data) ? data : data.results;
  } catch {
    return MOCK_PRODUCTS;
  }
}
