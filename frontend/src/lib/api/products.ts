import apiClient from "@/lib/api/client";
import type {
  Category,
  Product,
  ProductCreatePayload,
  PaginatedResponse,
} from "@/lib/types/api";

const MOCK_CATEGORIES: Category[] = [
  { id: "cat-001", name: "Alimentation & Céréales", slug: "alimentation" },
  { id: "cat-002", name: "Huiles & Condiments", slug: "huiles" },
  { id: "cat-003", name: "Boissons & Jus", slug: "boissons" },
  { id: "cat-004", name: "Cosmétiques & Hygiène", slug: "hygiene" },
  { id: "cat-005", name: "Entretien Maison", slug: "entretien" },
  { id: "cat-006", name: "Électronique & Accessoires", slug: "electronique" },
];

let mockProducts: Product[] = [
  {
    id: "prod-001",
    name: "Riz Parfumé 25kg Papillon",
    sku: "RIZ-PARF-25KG",
    barcode: "604200000101",
    category: MOCK_CATEGORIES[0],
    description: "Sac de riz blanc parfumé de qualité supérieure",
    purchase_price: 15500,
    selling_price: 18500,
    minimum_stock: 15,
    maximum_stock: 100,
    is_active: true,
    created_at: "2026-09-01T08:00:00Z",
  },
  {
    id: "prod-002",
    name: "Huile Végétale 5L Dinor",
    sku: "HUILE-DINOR-5L",
    barcode: "604200000102",
    category: MOCK_CATEGORIES[1],
    description: "Bidon d'huile raffinée 100% végétale",
    purchase_price: 5200,
    selling_price: 6000,
    minimum_stock: 20,
    maximum_stock: 150,
    is_active: true,
    created_at: "2026-09-01T08:00:00Z",
  },
  {
    id: "prod-003",
    name: "Lait Concentré Sucré Bonnet Rouge 1kg",
    sku: "LAIT-BNT-1KG",
    barcode: "604200000103",
    category: MOCK_CATEGORIES[0],
    description: "Boîte de conserve lait concentré",
    purchase_price: 1800,
    selling_price: 2200,
    minimum_stock: 30,
    maximum_stock: 200,
    is_active: true,
    created_at: "2026-09-01T08:00:00Z",
  },
  {
    id: "prod-004",
    name: "Savon de Marseille 400g",
    sku: "SAVON-MARS-400G",
    barcode: "604200000104",
    category: MOCK_CATEGORIES[3],
    description: "Savon corporel et ménager traditionnel",
    purchase_price: 350,
    selling_price: 500,
    minimum_stock: 50,
    maximum_stock: 500,
    is_active: true,
    created_at: "2026-09-01T08:00:00Z",
  },
];

export async function fetchCategories(): Promise<Category[]> {
  try {
    const { data } = await apiClient.get<PaginatedResponse<Category> | Category[]>(
      "/categories/?is_active=true&page_size=100"
    );
    if (Array.isArray(data)) return data;
    if ("results" in data && Array.isArray(data.results)) return data.results;
    return MOCK_CATEGORIES;
  } catch {
    return MOCK_CATEGORIES;
  }
}

export async function fetchProducts(filters?: {
  search?: string;
  is_active?: boolean;
}): Promise<Product[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.is_active !== undefined)
      params.set("is_active", String(filters.is_active));
    params.set("page_size", "100");

    const { data } = await apiClient.get<PaginatedResponse<Product> | Product[]>(
      `/products/?${params.toString()}`
    );
    if (Array.isArray(data)) return data;
    if ("results" in data && Array.isArray(data.results)) return data.results;
    return mockProducts;
  } catch {
    return mockProducts;
  }
}

export async function createProduct(payload: ProductCreatePayload): Promise<Product> {
  try {
    const { data } = await apiClient.post<Product>("/products/", payload);
    return data;
  } catch (error) {
    console.warn("Backend /products/ offline or returned error, creating simulated product", error);
    const cat = MOCK_CATEGORIES.find((c) => c.id === payload.category) || null;
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: payload.name,
      sku: payload.sku,
      barcode: payload.barcode || "",
      category: cat,
      description: payload.description || "",
      purchase_price: payload.purchase_price ?? 0,
      selling_price: payload.selling_price,
      minimum_stock: payload.minimum_stock ?? 5,
      maximum_stock: payload.maximum_stock ?? 100,
      is_active: payload.is_active ?? true,
      created_at: new Date().toISOString(),
    };
    mockProducts.unshift(newProd);
    return newProd;
  }
}
