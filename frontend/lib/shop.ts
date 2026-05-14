import { apiFetchWithRefresh } from "@/lib/api";

export type ShopOrderLine = {
  id: string;
  productId: string;
  productSlug: string;
  title: string;
  imageUrl: string;
  unitPrice: number;
  currency: string;
  quantity: number;
};

export type ShopOrder = {
  id: string;
  buyerId: string;
  sellerId: string;
  status: "processing" | "shipped" | "delivered" | "cancelled";
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
  lines: ShopOrderLine[];
};

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function fetchMyOrders(
  page = 1,
  limit = 20,
  status?: string,
): Promise<{ items: ShopOrder[]; meta: PageMeta }> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== "all") qs.set("status", status);
  return apiFetchWithRefresh<{ items: ShopOrder[]; meta: PageMeta }>(`/api/v1/request-orders?${qs.toString()}`, {
    service: "deal",
  });
}

export async function fetchMyOrder(id: string): Promise<ShopOrder> {
  return apiFetchWithRefresh<ShopOrder>(`/api/v1/request-orders/${encodeURIComponent(id)}`, { service: "deal" });
}

export async function fetchAdminCatalogOrders(
  page = 1,
  limit = 20,
  status?: string,
): Promise<{ items: ShopOrder[]; meta: PageMeta }> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) qs.set("status", status);
  return apiFetchWithRefresh<{ items: ShopOrder[]; meta: PageMeta }>(
    `/api/v1/admin/request-orders?${qs.toString()}`,
    { service: "admin" },
  );
}

export async function patchAdminCatalogOrder(
  id: string,
  body: Partial<{ status: ShopOrder["status"]; trackingNumber: string | null; carrier: string | null }>,
): Promise<ShopOrder> {
  return apiFetchWithRefresh<ShopOrder>(`/api/v1/admin/request-orders/${encodeURIComponent(id)}`, {
    method: "PATCH",
    service: "admin",
    body: JSON.stringify(body),
  });
}

export type DealProposal = {
  id: string;
  proposerId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

export type DealState = {
  proposals: DealProposal[];
  agreedPrice: number | null;
  agreedCurrency: string | null;
  agreedAt: string | null;
  requestTitle: string;
  requestCurrency: string;
  initialOffer: { id: string; price: number; currency: string; status: string } | null;
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

export async function acceptPriceProposal(proposalId: string): Promise<DealState> {
  return apiFetchWithRefresh<DealState>(`/api/v1/price-proposals/${encodeURIComponent(proposalId)}/accept`, {
    method: "POST",
    service: "deal",
  });
}

export async function demoPayConversation(conversationId: string, cardLast4: string): Promise<ShopOrder> {
  return apiFetchWithRefresh<ShopOrder>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/demo-pay`,
    {
      method: "POST",
      service: "deal",
      body: JSON.stringify({ cardLast4 }),
    },
  );
}

export async function fetchWalletMe(): Promise<{ balance: number }> {
  return apiFetchWithRefresh<{ balance: number }>("/api/v1/wallet/me", { service: "deal" });
}

export async function demoWithdrawWallet(amount: number): Promise<{ ok: true; withdrawn: number; balance: number }> {
  return apiFetchWithRefresh("/api/v1/wallet/demo-withdraw", {
    method: "POST",
    service: "deal",
    body: JSON.stringify({ amount }),
  });
}
