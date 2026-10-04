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
