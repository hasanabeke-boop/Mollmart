import { apiFetchWithRefresh } from "@/lib/api";
import type { PageMeta } from "@/lib/shop";

export type OrderCancellationRequest = {
  id: string;
  orderKind: "catalog" | "request_deal";
  orderId: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  adminNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  requestedBy: { id: string; name: string };
  reviewedBy: { id: string; name: string } | null;
  order: {
    title: string;
    total: number;
    currency: string;
    status: string;
    buyer: { id: string; name: string };
    seller: { id: string; name: string };
  } | null;
};

export async function createOrderCancellationRequest(orderId: string, reason: string) {
  return apiFetchWithRefresh<OrderCancellationRequest>("/api/v1/cancellation-requests", {
    method: "POST",
    body: JSON.stringify({ orderId, reason }),
  });
}

export async function fetchOrderCancellationRequest(orderId: string) {
  const data = await apiFetchWithRefresh<OrderCancellationRequest | undefined>(
    `/api/v1/cancellation-requests/order/${encodeURIComponent(orderId)}`,
  );
  return data ?? null;
}

export async function fetchMyCancellationRequests(page = 1, limit = 50) {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiFetchWithRefresh<{ items: OrderCancellationRequest[]; meta: PageMeta }>(
    `/api/v1/cancellation-requests/mine?${qs.toString()}`,
  );
}

export async function fetchAdminCancellationRequests(
  page = 1,
  limit = 20,
  status?: "pending" | "approved" | "rejected",
) {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) qs.set("status", status);
  return apiFetchWithRefresh<{ items: OrderCancellationRequest[]; meta: PageMeta }>(
    `/api/v1/admin/cancellation-requests?${qs.toString()}`,
  );
}

export async function approveCancellationRequest(id: string, adminNote?: string) {
  return apiFetchWithRefresh<OrderCancellationRequest>(
    `/api/v1/admin/cancellation-requests/${encodeURIComponent(id)}/approve`,
    {
      method: "POST",
      body: JSON.stringify({ adminNote: adminNote ?? "" }),
    },
  );
}

export async function rejectCancellationRequest(id: string, adminNote?: string) {
  return apiFetchWithRefresh<OrderCancellationRequest>(
    `/api/v1/admin/cancellation-requests/${encodeURIComponent(id)}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ adminNote: adminNote ?? "" }),
    },
  );
}
