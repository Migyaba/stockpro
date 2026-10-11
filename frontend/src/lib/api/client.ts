import axios, { type AxiosError, type AxiosResponse } from "axios";
import { useAuthStore } from "@/lib/stores/authStore";

const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const BASE_URL = RAW_BASE_URL.replace(/\/$/, "");

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ─── Request interceptor: attach JWT ──────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: handle 401 + token refresh ────────────────────
let isRefreshing = false;
let waitQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

// Session expirée ou révoquée : on vide le store et on renvoie vers le login
// (rechargement complet pour purger aussi le cache React Query).
function endSession() {
  useAuthStore.getState().logout();
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  if (pathname.startsWith("/login")) return;
  const next = encodeURIComponent(`${pathname}${search}`);
  window.location.assign(`/login?next=${next}&expired=1`);
}

function processQueue(error: unknown, token: string | null) {
  waitQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  waitQueue = [];
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & {
      _retry?: boolean;
    };
    if (error.response?.status !== 401 || original?._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waitQueue.push({ resolve, reject });
      }).then((token) => {
        original!.headers!.Authorization = `Bearer ${token}`;
        return apiClient(original!);
      });
    }

    original._retry = true;
    isRefreshing = true;

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      isRefreshing = false;
      endSession();
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(`${BASE_URL}/api/auth/refresh/`, {
        refresh: refreshToken,
      });
      const newAccess: string = data.access;
      useAuthStore.getState().setTokens(newAccess, data.refresh ?? refreshToken);
      processQueue(null, newAccess);
      original!.headers!.Authorization = `Bearer ${newAccess}`;
      return apiClient(original!);
    } catch (refreshError) {
      processQueue(refreshError, null);
      endSession();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ─── Helpers ──────────────────────────────────────────────────────────────
// Clé d'idempotence des validations (vente, réception, transfert) : un rejeu
// réseau avec la même clé ne crée pas de second mouvement de stock.
export function idempotencyHeaders(): Record<string, string> {
  const key =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return { "Idempotency-Key": key };
}

// Charge toutes les pages d'une liste paginée (listes déroulantes : produits,
// clients, fournisseurs…). Le backend plafonne page_size à 100.
export async function fetchAllPages<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  for (;;) {
    const query = new URLSearchParams({ ...params, page: String(page), page_size: "100" });
    const { data } = await apiClient.get<{ results: T[]; next: string | null } | T[]>(
      `${path}?${query.toString()}`
    );
    if (Array.isArray(data)) return data;
    results.push(...data.results);
    if (!data.next) return results;
    page += 1;
  }
}

// Le backend renvoie { error: { code, message } } ; on remonte ce message métier.
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { error?: { message?: string } } } })
    ?.response?.data;
  return data?.error?.message || fallback;
}

export default apiClient;
