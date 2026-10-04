import apiClient from "@/lib/api/client";
import type {
  SubscriptionStatus,
  CheckoutSessionPayload,
  CheckoutSessionResponse,
} from "@/lib/types/api";

export async function fetchSubscriptionStatus(): Promise<SubscriptionStatus> {
  const { data } = await apiClient.get<SubscriptionStatus>("/billing/subscription/");
  return data;
}

export async function createCheckoutSession(
  payload: CheckoutSessionPayload
): Promise<CheckoutSessionResponse> {
  const { data } = await apiClient.post<CheckoutSessionResponse>(
    "/billing/checkout/",
    payload
  );
  return data;
}

export interface VerifyPaymentResponse {
  reference: string;
  status: string;
  is_completed: boolean;
  plan: string;
  amount: number;
  subscription_ends_at: string | null;
  message: string;
}

export async function verifyPayment(
  reference?: string
): Promise<VerifyPaymentResponse> {
  const { data } = await apiClient.post<VerifyPaymentResponse>(
    "/billing/verify/",
    reference ? { reference } : {}
  );
  return data;
}
