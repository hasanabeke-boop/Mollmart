import { apiFetchWithRefresh } from "@/lib/api";

export type RequestDealOrderLine = {
  id: string;
  productId: string;
  productSlug: string;
  requestId?: string;
  title: string;
  imageUrl: string;
  unitPrice: number;
  currency: string;
  quantity: number;
};

export type RequestDealOrder = {
  id: string;
  buyerId: string;
  sellerId: string;
  status: "paid" | "in_progress" | "awaiting_confirmation" | "completed" | "cancelled";
  currency: string;
  subtotal: number;
  shippingAmount: number;
  total: number;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  seller: { id: string; name: string };
  buyer: { id: string; name: string };
  lines: RequestDealOrderLine[];
};

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function fetchMyRequestDealOrders(
  page = 1,
  limit = 20,
  status?: string,
): Promise<{ items: RequestDealOrder[]; meta: PageMeta }> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== "all") qs.set("status", status);
  return apiFetchWithRefresh<{ items: RequestDealOrder[]; meta: PageMeta }>(
    `/api/v1/request-orders?${qs.toString()}`,
    { service: "deal" },
  );
}

export async function fetchMyRequestDealOrder(id: string): Promise<RequestDealOrder> {
  return apiFetchWithRefresh<RequestDealOrder>(`/api/v1/request-orders/${encodeURIComponent(id)}`, {
    service: "deal",
  });
}

export async function fetchAdminRequestDealOrders(
  page = 1,
  limit = 20,
  status?: string,
): Promise<{ items: RequestDealOrder[]; meta: PageMeta }> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) qs.set("status", status);
  return apiFetchWithRefresh<{ items: RequestDealOrder[]; meta: PageMeta }>(
    `/api/v1/admin/request-orders?${qs.toString()}`,
    { service: "admin" },
  );
}

export async function patchAdminRequestDealOrder(
  id: string,
  body: Partial<{ status: RequestDealOrder["status"]; trackingNumber: string | null; carrier: string | null }>,
): Promise<RequestDealOrder> {
  return apiFetchWithRefresh<RequestDealOrder>(`/api/v1/admin/request-orders/${encodeURIComponent(id)}`, {
    method: "PATCH",
    service: "admin",
    body: JSON.stringify(body),
  });
}

export { deleteAdminRequestOrder } from "@/lib/admin";

export type DealProposal = {
  id: string;
  proposerId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

export type DealInitialOffer = {
  id: string;
  unitPrice: number;
  totalPrice: number;
  /** @deprecated use unitPrice */
  price: number;
  quantity: number;
  currency: string;
  status: string;
};

export type DealState = {
  proposals: DealProposal[];
  agreedPrice: number | null;
  agreedCurrency: string | null;
  agreedAt: string | null;
  requestTitle: string;
  requestCurrency: string;
  requestQuantity: number;
  initialOffer: DealInitialOffer | null;
  orderId: string | null;
};

export async function fetchDealState(conversationId: string): Promise<DealState> {
  return apiFetchWithRefresh<DealState>(`/api/v1/conversations/${encodeURIComponent(conversationId)}/deal-state`, {
    service: "deal",
  });
}

export async function postPriceProposal(
  conversationId: string,
  body: { amount: number; currency: string },
): Promise<DealState> {
  return apiFetchWithRefresh<DealState>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/price-proposals`,
    {
      method: "POST",
      service: "deal",
      body: JSON.stringify(body),
    },
  );
}

/** Propose line total from linked offer (unit price x request quantity). */
export async function postApplyOfferTotal(conversationId: string): Promise<DealState> {
  return apiFetchWithRefresh<DealState>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/apply-offer-total`,
    {
      method: "POST",
      service: "deal",
    },
  );
}

export async function acceptPriceProposal(proposalId: string): Promise<DealState> {
  return apiFetchWithRefresh<DealState>(`/api/v1/price-proposals/${encodeURIComponent(proposalId)}/accept`, {
    method: "POST",
    service: "deal",
  });
}

export async function demoPayConversation(
  conversationId: string,
  card: { cardLast4: string; cardHolderName?: string },
): Promise<RequestDealOrder> {
  return apiFetchWithRefresh<RequestDealOrder>(`/api/v1/conversations/${encodeURIComponent(conversationId)}/demo-pay`, {
    method: "POST",
    service: "deal",
    body: JSON.stringify({
      cardLast4: card.cardLast4.trim(),
      cardHolderName: card.cardHolderName?.trim(),
    }),
  });
}

export async function fetchWalletMe(): Promise<{ balance: number }> {
  return apiFetchWithRefresh<{ balance: number }>("/api/v1/wallet/me", { service: "deal" });
}

export async function demoWithdrawWallet(
  amount: number,
  card: { cardLast4: string; cardHolderName: string },
): Promise<{ ok: true; withdrawn: number; balance: number }> {
  return apiFetchWithRefresh("/api/v1/wallet/demo-withdraw", {
    method: "POST",
    service: "deal",
    body: JSON.stringify({
      amount,
      cardLast4: card.cardLast4.trim(),
      cardHolderName: card.cardHolderName.trim(),
    }),
  });
}
