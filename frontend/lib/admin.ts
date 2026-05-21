import { apiFetchWithRefresh } from "@/lib/api";
import type { PageMeta } from "@/lib/requestDeals";

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

export async function deleteAdminRequestOrder(id: string): Promise<void> {
  await apiFetchWithRefresh(`/api/v1/admin/request-orders/${encodeURIComponent(id)}`, {
    method: "DELETE",
    service: "admin",
  });
}
