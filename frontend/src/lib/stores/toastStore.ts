import { create } from "zustand";
import { getApiErrorMessage } from "@/lib/api/client";

export type ToastVariant = "success" | "error";

export interface Toast {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (variant: ToastVariant, message: string) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (variant, message) => {
    const id = nextId++;
    set({ toasts: [...get().toasts, { id, variant, message }] });
    setTimeout(() => get().dismiss(id), variant === "error" ? 7000 : 4000);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().push("success", message),
  error: (message: string) => useToastStore.getState().push("error", message),
  /** Affiche le message métier renvoyé par l'API (ex. « Stock insuffisant… »). */
  apiError: (error: unknown, fallback: string) =>
    useToastStore.getState().push("error", getApiErrorMessage(error, fallback)),
};
