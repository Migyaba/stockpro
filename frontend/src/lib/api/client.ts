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
      useAuthStore.getState().logout();
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
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
