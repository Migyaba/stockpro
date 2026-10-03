import apiClient from "@/lib/api/client";
import type {
  Purchase,
  PurchaseStatus,
  PaginatedResponse,
  CreatePurchasePayload,
  ReceivePurchasePayload,
} from "@/lib/types/api";

export interface PurchaseFilters {
  page?: number;
  page_size?: number;
  search?: string;
  status?: PurchaseStatus | "";
  warehouse?: string;
  supplier?: string;
  ordering?: string;
}

const MOCK_PURCHASES: Purchase[] = [
  {
    id: "purch-001",
    reference: "ACH-2026-0018",
    status: "CONFIRMED",
    supplier: "sup-001",
    supplier_name: "Grands Moulins de Dakar (GMD)",
    warehouse: "wh-dakar-01",
    warehouse_name: "Entrepôt Principal Dakar",
    purchase_date: "2026-09-20",
    expected_date: "2026-09-25",
    subtotal: 1550000,
    discount: 50000,
    tax: 0,
    total: 1500000,
    items: [
      {
        id: "pitem-1",
        product: "prod-001",
        product_name: "Riz Parfumé 25kg Papillon",
        quantity: 100,
        quantity_received: 0,
        unit_price: 15500,
        discount: 500,
        tax: 0,
        total: 1500000,
      },
    ],
    created_at: "2026-09-20T08:30:00Z",
  },
  {
    id: "purch-002",
    reference: "ACH-2026-0017",
    status: "PARTIALLY_RECEIVED",
    supplier: "sup-002",
    supplier_name: "Sedar Agro & Huiles Abidjan",
    warehouse: "wh-dakar-01",
    warehouse_name: "Entrepôt Principal Dakar",
    purchase_date: "2026-09-18",
    expected_date: "2026-09-22",
    subtotal: 520000,
    discount: 0,
    tax: 0,
    total: 520000,
    items: [
      {
        id: "pitem-2",
        product: "prod-002",
        product_name: "Huile Végétale 5L Dinor",
        quantity: 100,
        quantity_received: 60,
        unit_price: 5200,
        discount: 0,
        tax: 0,
        total: 520000,
      },
    ],
    created_at: "2026-09-18T11:20:00Z",
  },
  {
    id: "purch-003",
    reference: "ACH-2026-0016",
    status: "RECEIVED",
    supplier: "sup-004",
    supplier_name: "Sahel Import-Export Logistique",
    warehouse: "wh-dakar-01",
    warehouse_name: "Entrepôt Principal Dakar",
    purchase_date: "2026-09-15",
    expected_date: "2026-09-17",
    subtotal: 360000,
    discount: 0,
    tax: 0,
    total: 360000,
    items: [
      {
        id: "pitem-3",
        product: "prod-003",
        product_name: "Lait Concentré Sucré Bonnet Rouge 1kg",
        quantity: 200,
        quantity_received: 200,
        unit_price: 1800,
        discount: 0,
        tax: 0,
        total: 360000,
      },
    ],
    created_at: "2026-09-15T09:00:00Z",
  },
  {
    id: "purch-004",
    reference: "ACH-2026-0015",
    status: "DRAFT",
    supplier: "sup-003",
    supplier_name: "Société des Brasseries et Boissons du Bénin",
    warehouse: "wh-dakar-01",
    warehouse_name: "Entrepôt Principal Dakar",
    purchase_date: "2026-09-21",
    expected_date: "2026-09-28",
    subtotal: 175000,
    discount: 0,
    tax: 0,
    total: 175000,
    items: [
      {
        id: "pitem-4",
        product: "prod-004",
        product_name: "Savon de Marseille 400g",
        quantity: 500,
        quantity_received: 0,
        unit_price: 350,
        discount: 0,
        tax: 0,
        total: 175000,
      },
    ],
    created_at: "2026-09-21T07:15:00Z",
  },
];

let mockPurchases: Purchase[] = [...MOCK_PURCHASES];

export async function fetchPurchases(
  filters: PurchaseFilters = {}
): Promise<PaginatedResponse<Purchase>> {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== "") params.set(k, String(v));
    });
    const { data } = await apiClient.get<PaginatedResponse<Purchase>>(
      `/purchases/?${params.toString()}`
    );
    return data;
  } catch {
    let list = [...mockPurchases];
    if (filters.status) {
      list = list.filter((p) => p.status === filters.status);
    }
    if (filters.warehouse) {
      list = list.filter((p) => p.warehouse === filters.warehouse);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.reference.toLowerCase().includes(q) ||
          p.supplier_name.toLowerCase().includes(q)
      );
    }

    const pageSize = filters.page_size ?? 25;
    const page = filters.page ?? 1;
    const start = (page - 1) * pageSize;
    const paginated = list.slice(start, start + pageSize);

    return {
      count: list.length,
      next: start + pageSize < list.length ? `?page=${page + 1}` : null,
      previous: page > 1 ? `?page=${page - 1}` : null,
      results: paginated,
    };
  }
}

export async function fetchPurchaseDetail(id: string): Promise<Purchase> {
  try {
    const { data } = await apiClient.get<Purchase>(`/purchases/${id}/`);
    return data;
  } catch {
    const item = mockPurchases.find((p) => p.id === id);
    if (!item) throw new Error("Achat introuvable");
    return item;
  }
}

export async function createPurchase(
  payload: CreatePurchasePayload
): Promise<Purchase> {
  try {
    const { data } = await apiClient.post<Purchase>("/purchases/", payload);
    return data;
  } catch (error) {
    console.warn("Backend /purchases/ offline, creating local purchase", error);

    const subtotal = payload.items.reduce(
      (acc, it) => acc + it.quantity * it.unit_price,
      0
    );
    const discount = payload.items.reduce(
      (acc, it) => acc + (it.discount ?? 0),
      0
    );
    const total = subtotal - discount;

    const newPurchase: Purchase = {
      id: `purch-${Date.now()}`,
      reference: `ACH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "DRAFT",
      supplier: payload.supplier,
      supplier_name: "Fournisseur",
      warehouse: payload.warehouse,
      warehouse_name: "Dépôt sélectionné",
      purchase_date: payload.purchase_date || new Date().toISOString().split("T")[0],
      expected_date: payload.expected_date || null,
      subtotal,
      discount,
      tax: 0,
      total,
      items: payload.items.map((it, idx) => ({
        id: `pitem-${Date.now()}-${idx}`,
        product: it.product,
        product_name: "Produit commandé",
        quantity: it.quantity,
        quantity_received: 0,
        unit_price: it.unit_price,
        discount: it.discount ?? 0,
        tax: 0,
        total: it.quantity * it.unit_price - (it.discount ?? 0),
      })),
      created_at: new Date().toISOString(),
    };

    mockPurchases.unshift(newPurchase);
    return newPurchase;
  }
}

export async function confirmPurchase(id: string): Promise<Purchase> {
  try {
    const { data } = await apiClient.post<Purchase>(
      `/purchases/${id}/confirm/`
    );
    return data;
  } catch {
    const item = mockPurchases.find((p) => p.id === id);
    if (!item) throw new Error("Achat introuvable");
    item.status = "CONFIRMED";
    return { ...item };
  }
}

export async function receivePurchase(
  id: string,
  payload: ReceivePurchasePayload
): Promise<Purchase> {
  try {
    const { data } = await apiClient.post<Purchase>(
      `/purchases/${id}/receive/`,
      payload
    );
    return data;
  } catch {
    const item = mockPurchases.find((p) => p.id === id);
    if (!item) throw new Error("Achat introuvable");

    // Apply received lines
    payload.lines.forEach((line) => {
      const pItem = item.items.find((it) => it.id === line.purchase_item_id);
      if (pItem) {
        pItem.quantity_received = Math.min(
          pItem.quantity,
          pItem.quantity_received + line.quantity
        );
      }
    });

    // Check if fully received or partially received
    const allFull = item.items.every(
      (it) => it.quantity_received >= it.quantity
    );
    const anyReceived = item.items.some((it) => it.quantity_received > 0);

    item.status = allFull
      ? "RECEIVED"
      : anyReceived
      ? "PARTIALLY_RECEIVED"
      : item.status;

    return { ...item };
  }
}

export async function cancelPurchase(id: string): Promise<Purchase> {
  try {
    const { data } = await apiClient.post<Purchase>(`/purchases/${id}/cancel/`);
    return data;
  } catch {
    const item = mockPurchases.find((p) => p.id === id);
    if (!item) throw new Error("Achat introuvable");
    item.status = "CANCELLED";
    return { ...item };
  }
}
