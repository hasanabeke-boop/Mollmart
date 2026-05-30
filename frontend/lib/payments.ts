import { apiFetch, apiFetchWithRefresh } from "@/lib/api";

export type PaymentConfig = {
  stripeEnabled: boolean;
  allowedCurrencies: string[];
};

export type StripeCheckoutSession = {
  id: string;
  url: string;
};

export async function fetchPaymentConfig(): Promise<PaymentConfig> {
  return apiFetch<PaymentConfig>("/api/v1/payments/config", { service: "deal" });
}

export async function createCartStripeCheckoutSession(body: {
  checkoutCurrency: string;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
}): Promise<StripeCheckoutSession> {
  return apiFetchWithRefresh<StripeCheckoutSession>("/api/v1/payments/cart/checkout-session", {
    method: "POST",
    service: "shop",
    body: JSON.stringify(body),
  });
}

export async function createRequestDealStripeCheckoutSession(
  conversationId: string,
): Promise<StripeCheckoutSession> {
  return apiFetchWithRefresh<StripeCheckoutSession>("/api/v1/payments/request-deal/checkout-session", {
    method: "POST",
    service: "deal",
    body: JSON.stringify({ conversationId }),
  });
}
