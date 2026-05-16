import { apiFetchWithRefresh } from "@/lib/api";
import type { PageMeta, ShopOrder } from "@/lib/shop";

export type AdminRequestRow = {
  id: string;
  title: string;
  status: string;
  currency: string;
  quantity: number;
  offerCount: number;
  offersCount: number;
  dealOrdersCount: number;
  createdAt: string;
  publishedAt: string | null;
  categoryId: string;
  buyer: { id: string; name: string; email: string };
};

export async function fetchAdminRequests(
  page = 1,
  limit = 20,
  q?: string,
): Promise<{ items: AdminRequestRow[]; meta: PageMeta }> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q?.trim()) qs.set("q", q.trim());
  return apiFetchWithRefresh<{ items: AdminRequestRow[]; meta: PageMeta }>(
    `/api/v1/admin/requests?${qs.toString()}`,
    { service: "admin" },
  );
}

export async function deleteAdminRequest(id: string): Promise<void> {
  await apiFetchWithRefresh(`/api/v1/admin/requests/${encodeURIComponent(id)}`, {
    method: "DELETE",
    service: "admin",
  });
}

export async function fetchAdminShopCatalogOrders(
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

export async function deleteAdminRequestOrder(id: string): Promise<void> {
  await apiFetchWithRefresh(`/api/v1/admin/request-orders/${encodeURIComponent(id)}`, {
    method: "DELETE",
    service: "admin",
  });
}

export async function patchAdminShopCatalogOrder(
  id: string,
  body: Partial<{ status: ShopOrder["status"]; trackingNumber: string | null; carrier: string | null }>,
): Promise<ShopOrder> {
  return apiFetchWithRefresh<ShopOrder>(`/api/v1/admin/catalog-orders/${encodeURIComponent(id)}`, {
    method: "PATCH",
    service: "admin",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminCatalogOrder(id: string): Promise<void> {
  await apiFetchWithRefresh(`/api/v1/admin/catalog-orders/${encodeURIComponent(id)}`, {
    method: "DELETE",
    service: "admin",
  });
}
