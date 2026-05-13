import { apiFetchWithRefresh } from "@/lib/api";
import { CATALOG_CURRENCIES, normalizeCatalogCurrencyCode } from "@/lib/catalog";

export type ShopCartItem = {
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

export type ShopCartResponse = { items: ShopCartItem[] };

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

export async function fetchShopCart(): Promise<ShopCartResponse> {
  return apiFetchWithRefresh<ShopCartResponse>("/api/v1/shop/cart", { service: "shop" });
}

export async function addToShopCart(productId: string, quantity = 1): Promise<ShopCartItem> {
  return apiFetchWithRefresh<ShopCartItem>("/api/v1/shop/cart/items", {
    method: "POST",
    service: "shop",
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function setShopCartQuantity(
  productId: string,
  quantity: number,
): Promise<ShopCartItem | { removed: true }> {
  return apiFetchWithRefresh<ShopCartItem | { removed: true }>(
    `/api/v1/shop/cart/items/${encodeURIComponent(productId)}`,
    {
      method: "PATCH",
      service: "shop",
      body: JSON.stringify({ quantity }),
    },
  );
}

export async function removeShopCartItem(productId: string): Promise<void> {
  await apiFetchWithRefresh(`/api/v1/shop/cart/items/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    service: "shop",
  });
}

export type CheckoutPayload = {
  checkoutCurrency: string;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
};

export async function shopCheckout(body: CheckoutPayload): Promise<{ orders: ShopOrder[] }> {
  return apiFetchWithRefresh<{ orders: ShopOrder[] }>("/api/v1/shop/checkout", {
    method: "POST",
    service: "shop",
    body: JSON.stringify(body),
  });
}

export async function fetchMyOrders(
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

export async function fetchMyOrder(id: string): Promise<ShopOrder> {
  return apiFetchWithRefresh<ShopOrder>(`/api/v1/shop/orders/${encodeURIComponent(id)}`, { service: "shop" });
}

export { CATALOG_CURRENCIES, normalizeCatalogCurrencyCode };

export async function fetchAdminCatalogOrders(
  page = 1,
  limit = 20,
  status?: string,
): Promise<{ items: ShopOrder[]; meta: PageMeta }> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) qs.set("status", status);
  return apiFetchWithRefresh<{ items: ShopOrder[]; meta: PageMeta }>(
    `/api/v1/admin/catalog-orders?${qs.toString()}`,
    { service: "admin" },
  );
}

export async function patchAdminCatalogOrder(
  id: string,
  body: Partial<{ status: ShopOrder["status"]; trackingNumber: string | null; carrier: string | null }>,
): Promise<ShopOrder> {
  return apiFetchWithRefresh<ShopOrder>(`/api/v1/admin/catalog-orders/${encodeURIComponent(id)}`, {
    method: "PATCH",
    service: "admin",
    body: JSON.stringify(body),
  });
}
