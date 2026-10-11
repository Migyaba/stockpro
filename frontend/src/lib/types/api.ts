// ─── Pagination ────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  /** Requis quand le compte appartient à plusieurs organisations. */
  organization_id?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  organization_name: string;
  warehouse_name: string;
  warehouse_address?: string;
  country: string;
  currency: string;
  timezone?: string;
}

// ─── User & Auth Profile ───────────────────────────────────────────────────
export type Role = "OWNER" | "ADMINISTRATOR" | "MANAGER" | "STAFF";

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  full_name: string;
  role?: Role;
}

// ─── Organization ──────────────────────────────────────────────────────────
export type OrgStatus = "ACTIVE" | "TRIAL" | "SUSPENDED" | "CANCELLED";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  country: string;
  currency: string;
  currency_exponent: number;
  timezone: string;
  language: string;
  tax_enabled: boolean;
  tax_rate_bps: number;
  prices_include_tax: boolean;
  max_discount_percent_manager: number;
  address?: string;
  phone?: string;
  email?: string;
  status: OrgStatus;
  trial_ends_at: string | null;
}

// ─── Membership ────────────────────────────────────────────────────────────
export interface Membership {
  id: string;
  role: Role;
  is_active: boolean;
  /** Codes de permission calculés par le backend (ex. "sales.cancel"). */
  permissions: string[];
  warehouse_ids: string[];
  organization: Organization;
}

// ─── Warehouse ─────────────────────────────────────────────────────────────
export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  manager_name: string;
  is_active: boolean;
}

// ─── Products ──────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  parent: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  /** Identifiant de la catégorie (le nom est dans category_name). */
  category: string | null;
  category_name?: string | null;
  description: string;
  unit?: string;
  purchase_price: number;
  selling_price: number;
  minimum_stock: number;
  maximum_stock?: number;
  is_active: boolean;
  /** Stock total tous dépôts confondus (calculé par l'API). */
  total_stock?: number;
  image?: string | null;
  created_at: string;
  updated_at?: string;
}

// ─── Stock ─────────────────────────────────────────────────────────────────
export interface StockPosition {
  id: string;
  product: Product;
  warehouse: Warehouse;
  quantity: number;
}

export type MovementType =
  | "INITIAL"
  | "PURCHASE"
  | "SALE"
  | "SALE_CANCEL"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "INVENTORY_ADJUSTMENT"
  | "RETURN"
  | "DAMAGE"
  | "OTHER";

export interface StockMovement {
  id: string;
  product: string;
  warehouse: string;
  type: MovementType;
  quantity: number;
  unit_cost: number;
  reference_type: string;
  reference_id: string;
  reason: string;
  created_by: string | null;
  created_at: string;
}

// ─── Sales ─────────────────────────────────────────────────────────────────
export type SaleStatus = "DRAFT" | "COMPLETED" | "CANCELLED";

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface CreateCustomerPayload {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
}

export interface CreateWarehousePayload {
  name: string;
  code: string;
  address?: string;
  city?: string;
  manager_name?: string;
  is_active?: boolean;
}

export interface OrganizationMember {
  id: string;
  user: UserProfile;
  role: Role;
  is_active: boolean;
  created_at: string;
  warehouse_ids?: string[];
}

export interface InviteMemberPayload {
  email: string;
  role: Role;
  warehouse_ids?: string[];
}

export interface Invitation {
  id: string;
  email: string;
  role: Role;
  warehouse_ids: string[];
  invited_by_name?: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  /** Présent uniquement dans la réponse de création (le jeton n'est pas stocké en clair). */
  invitation_url?: string;
}

export interface UpdateMemberPayload {
  role?: Role;
  is_active?: boolean;
  /** Liste vide = accès à tous les dépôts. */
  warehouse_ids?: string[];
}

export interface SaleItem {
  id: string;
  product: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  total: number;
}

export interface CreateSaleItemPayload {
  product: string;
  quantity: number;
  unit_price?: number;
  discount?: number;
  tax?: number;
}

export interface CreateSalePayload {
  warehouse: string;
  customer?: string | null;
  sale_date?: string;
  items: CreateSaleItemPayload[];
}

export interface Sale {
  id: string;
  reference: string;
  status: SaleStatus;
  sale_date: string;
  warehouse: string;
  warehouse_name?: string;
  customer: string | null;
  customer_name?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  items: SaleItem[];
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
}

// ─── Suppliers ────────────────────────────────────────────────────────────
export interface Supplier {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  notes: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateSupplierPayload {
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
}

// ─── Purchases ─────────────────────────────────────────────────────────────
export type PurchaseStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

export interface PurchaseItem {
  id: string;
  product: string;
  product_name: string;
  quantity: number;
  quantity_received: number;
  unit_price: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Purchase {
  id: string;
  reference: string;
  status: PurchaseStatus;
  supplier: string;
  supplier_name: string;
  warehouse: string;
  warehouse_name: string;
  purchase_date: string;
  expected_date: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  items: PurchaseItem[];
  created_at: string;
}

export interface CreatePurchaseItemPayload {
  product: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  tax?: number;
}

export interface CreatePurchasePayload {
  supplier: string;
  warehouse: string;
  purchase_date?: string;
  expected_date?: string | null;
  items: CreatePurchaseItemPayload[];
}

export interface ReceiveLinePayload {
  purchase_item_id: string;
  quantity: number;
}

export interface ReceivePurchasePayload {
  lines: ReceiveLinePayload[];
}

export interface ProductCreatePayload {
  name: string;
  category?: string | null;
  sku: string;
  barcode?: string;
  description?: string;
  unit?: string;
  purchase_price?: number;
  selling_price: number;
  minimum_stock?: number;
  maximum_stock?: number;
  is_active?: boolean;
  initial_quantity?: number;
  initial_warehouse?: string;
}

// ─── Dashboard ─────────────────────────────────────────────────────────────
export interface DashboardKpis {
  products_count: number;
  /** 0 pour les rôles sans accès aux coûts. */
  stock_value: number;
  sales_today: number;
  sales_today_count: number;
  /** Sous le seuil minimum mais pas en rupture. */
  low_stock_count: number;
  out_of_stock_count: number;
  pending_purchases: number;
  warehouses_count: number;
  sales_week_total: number;
  sales_month_total: number;
  sales_month_count: number;
  sales_month_evolution_pct: number | null;
  purchases_month_total: number;
  /** null pour les rôles sans accès aux coûts. */
  margin_month: number | null;
  margin_month_pct: number | null;
}

// ─── Stock Level Badge ─────────────────────────────────────────────────────
export type StockLevel = "normal" | "low" | "critical" | "out_of_stock";

export function getStockLevel(
  quantity: number,
  minimumStock: number
): StockLevel {
  if (quantity === 0) return "out_of_stock";
  if (quantity < minimumStock) return "critical";
  if (quantity < minimumStock * 2) return "low";
  return "normal";
}

// ─── Billing & Subscriptions (AlphaPay) ────────────────────────────────────
export type SubscriptionPlan = "TRIAL" | "MONTHLY" | "QUARTERLY" | "CUSTOM";

export interface SubscriptionPaymentRecord {
  id: string;
  reference: string;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  created_at: string;
  paid_at: string | null;
}

export interface SubscriptionStatus {
  organization_id: string;
  organization_name: string;
  status: OrgStatus;
  plan: SubscriptionPlan;
  has_active_access: boolean;
  has_custom_pricing?: boolean;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  days_remaining: number;
  pricing: {
    monthly: { amount: number; period: string; label: string; is_custom?: boolean };
    quarterly: { amount: number; period: string; label: string; is_custom?: boolean };
  };
  recent_payments: SubscriptionPaymentRecord[];
}

export interface CheckoutSessionPayload {
  plan: "monthly" | "quarterly";
  phone?: string;
  return_url?: string;
}

export interface CheckoutSessionResponse {
  checkout_url: string;
  reference: string;
  amount: number;
  plan: string;
  is_sandbox?: boolean;
}


// ─── Résumés de listes (calculés côté serveur, toutes pages confondues) ─────
export interface SalesSummary {
  count: number;
  completed_count: number;
  draft_count: number;
  cancelled_count: number;
  completed_total: number;
  average_ticket: number;
}

export interface PurchasesSummary {
  count: number;
  draft_count: number;
  pending_count: number;
  received_count: number;
  cancelled_count: number;
  received_total: number;
}

// ─── Transferts entre dépôts ────────────────────────────────────────────────
export type TransferStatus = "DRAFT" | "COMPLETED" | "CANCELLED";

export interface TransferItem {
  id: string;
  product: string;
  product_name: string;
  quantity: number;
}

export interface Transfer {
  id: string;
  reference: string;
  source: string;
  source_name: string;
  destination: string;
  destination_name: string;
  status: TransferStatus;
  notes: string;
  items: TransferItem[];
  created_at: string;
  completed_at: string | null;
}

export interface CreateTransferPayload {
  source: string;
  destination: string;
  notes?: string;
  items: { product: string; quantity: number }[];
}

// ─── Rapports (calculés côté serveur) ───────────────────────────────────────
export interface ReportPeriodParams {
  date_from: string;
  date_to: string;
  warehouse?: string;
}

export interface SalesReportProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  revenue: number;
  /** Absents si le rôle n'a pas accès aux coûts. */
  cost?: number;
  margin?: number;
}

export interface SalesReport {
  period: { date_from: string; date_to: string };
  previous_period: { date_from: string; date_to: string };
  totals: {
    revenue: number;
    revenue_excl_tax: number;
    tax: number;
    discount: number;
    count: number;
    average_ticket: number;
    previous_revenue: number;
    revenue_evolution_pct: number | null;
    cost?: number;
    margin?: number;
    margin_pct?: number | null;
  };
  series: { date: string; revenue: number; count: number; margin?: number }[];
  top_products: SalesReportProduct[];
  least_products: SalesReportProduct[];
  by_warehouse: { id: string; name: string; revenue: number; count: number }[];
  by_category: { name: string; revenue: number; quantity: number }[];
  products: SalesReportProduct[];
}

export interface PurchasesReport {
  period: { date_from: string; date_to: string };
  totals: {
    ordered: number;
    count: number;
    received_value: number;
    previous_ordered: number;
    ordered_evolution_pct: number | null;
  };
  top_suppliers: { id: string; name: string; total: number; count: number }[];
}

export type ExportKind = "sales" | "products" | "stock" | "movements" | "purchases" | "inventory";

// ─── Inventaires ────────────────────────────────────────────────────────────
export type InventoryStatus = "DRAFT" | "COUNTING" | "REVIEW" | "VALIDATED" | "CANCELLED";

export interface InventoryCount {
  id: string;
  reference: string;
  warehouse: string;
  warehouse_name: string;
  category: string | null;
  category_name: string | null;
  status: InventoryStatus;
  notes: string;
  /** `differences` absent pour les compteurs (comptage à l'aveugle). */
  stats: { lines: number; counted: number; uncounted: number; differences?: number };
  created_by_name: string | null;
  started_at: string | null;
  validated_by_name: string | null;
  validated_at: string | null;
  created_at: string;
}

export interface InventoryLine {
  id: string;
  product: string;
  product_name: string;
  product_sku: string;
  product_barcode: string;
  unit: string;
  counted_quantity: number | null;
  counted_by_name: string | null;
  counted_at: string | null;
  /** Visibles uniquement pour les rôles qui valident. */
  expected_quantity?: number;
  difference?: number | null;
  stock_changed?: boolean;
}

export type CountEntry =
  | { product: string; counted_quantity: number | null }
  | { code: string; add: number };

// ─── Alertes, notifications, audit ──────────────────────────────────────────
export interface StockAlert {
  id: string;
  kind: "out" | "low";
  product: string;
  product_name: string;
  product_sku: string;
  unit: string;
  warehouse: string;
  warehouse_name: string;
  quantity: number;
  minimum_stock: number;
}

export interface StockAlertPage extends PaginatedResponse<StockAlert> {
  summary: { out: number; low: number };
}

export interface AppNotification {
  id: string;
  kind: "STOCK_LOW" | "STOCK_OUT" | "PURCHASE_RECEIVED" | "TRANSFER_COMPLETED" | "INVENTORY_REVIEW";
  message: string;
  link: string;
  read_at: string | null;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  created_at: string;
  user_name: string;
  action: string;
  action_label: string;
  entity_type: string;
  entity_id: string;
  entity_label: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
}
