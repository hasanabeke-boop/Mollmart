import { apiFetchWithRefresh } from "@/lib/api";

export type CartItem = {
  productId: string;
  quantity: number;
  title: string;
  slug: string;
  imageUrl: string;
  unitPrice: number;
  currency: string;
  maxQuantity: number;
  sellerId: string;
  sellerName: string;
};

export type ShopOrderLine = {
  id: string;
  productId: string;
  productSlug: string;
  /** Buyer request id when this line is a paid request deal (not a catalog SKU). */
  requestId?: string;
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

export async function fetchCart(): Promise<{ items: CartItem[] }> {
  return apiFetchWithRefresh<{ items: CartItem[] }>("/api/v1/shop/cart", { service: "shop" });
}

export async function addCartItem(productId: string, quantity = 1): Promise<CartItem> {
  return apiFetchWithRefresh<CartItem>("/api/v1/shop/cart/items", {
    method: "POST",
    service: "shop",
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function updateCartItem(productId: string, quantity: number): Promise<CartItem | { removed: true }> {
  return apiFetchWithRefresh<CartItem | { removed: true }>(`/api/v1/shop/cart/items/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    service: "shop",
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(productId: string): Promise<void> {
  await apiFetchWithRefresh(`/api/v1/shop/cart/items/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    service: "shop",
  });
}

export async function checkoutCart(body: {
  checkoutCurrency: string;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
}): Promise<{ orders: ShopOrder[] }> {
  return apiFetchWithRefresh<{ orders: ShopOrder[] }>("/api/v1/shop/checkout", {
    method: "POST",
    service: "shop",
    body: JSON.stringify(body),
  });
}

async function fetchCatalogOrders(
  page = 1,
  limit = 20,
  status?: string,
): Promise<{ items: ShopOrder[]; meta: PageMeta }> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== "all") qs.set("status", status);
  return apiFetchWithRefresh<{ items: ShopOrder[]; meta: PageMeta }>(`/api/v1/shop/orders?${qs.toString()}`, {
    service: "shop",
  });
}

export async function fetchMyOrders(
  page = 1,
  limit = 20,
  status?: string,
): Promise<{ items: ShopOrder[]; meta: PageMeta }> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== "all") qs.set("status", status);
  const [requestOrders, catalogOrders] = await Promise.allSettled([
    apiFetchWithRefresh<{ items: ShopOrder[]; meta: PageMeta }>(`/api/v1/request-orders?${qs.toString()}`, {
      service: "deal",
    }),
    fetchCatalogOrders(page, limit, status),
  ]);

  const requestValue =
    requestOrders.status === "fulfilled"
      ? requestOrders.value
      : { items: [] as ShopOrder[], meta: { page, limit, total: 0, totalPages: 1 } };
  const catalogValue =
    catalogOrders.status === "fulfilled"
      ? catalogOrders.value
      : { items: [] as ShopOrder[], meta: { page, limit, total: 0, totalPages: 1 } };
  const items = [...requestValue.items, ...catalogValue.items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  ).slice(0, limit);
  const total = requestValue.meta.total + catalogValue.meta.total;

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function fetchMyOrder(id: string): Promise<ShopOrder> {
  try {
    return await apiFetchWithRefresh<ShopOrder>(`/api/v1/request-orders/${encodeURIComponent(id)}`, { service: "deal" });
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status !== 404) throw err;
    return apiFetchWithRefresh<ShopOrder>(`/api/v1/shop/orders/${encodeURIComponent(id)}`, { service: "shop" });
  }
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

/** Propose line total from linked offer (unit price × request quantity). */
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
