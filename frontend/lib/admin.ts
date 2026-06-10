import { apiFetchWithRefresh } from "@/lib/api";
import type { PageMeta } from "@/lib/requestDeals";
import type { ShopOrder } from "@/lib/shop";

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

export type AdminPlatformReport = {
  users: { blocked: number; flagged: number };
  requests: { flagged: number; hidden: number };
  offers: { flagged: number; hidden: number };
  flags: { total: number; active: number };
  moderation: {
    openCases: number;
    inReviewCases: number;
    resolvedCases: number;
    dismissedCases: number;
  };
  categories: { total: number; active: number };
  platform: {
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    suspendedUsers: number;
    buyers: number;
    sellers: number;
    admins: number;
    totalRequests: number;
    publishedRequests: number;
    totalOffers: number;
    catalogProducts: number;
    publishedProducts: number;
    catalogOrders: number;
    requestDealOrders: number;
    openCatalogOrders: number;
    openRequestDealOrders: number;
    conversations: number;
    notifications: number;
  };
  recent: {
    usersLast7Days: number;
    requestsLast7Days: number;
    catalogOrdersLast7Days: number;
    requestDealOrdersLast7Days: number;
  };
  revenue: {
    completedCatalogOrders: number;
    completedRequestDealOrders: number;
  };
  checkedAt: string;
};

export type DatabaseTableStat = {
  table: string;
  rowEstimate: number;
};

export type DatabaseStats = {
  connected: boolean;
  databaseName: string;
  databaseSizeBytes: number;
  databaseSizeHuman: string;
  checkedAt: string;
  tables: DatabaseTableStat[];
  totals: {
    users: number;
    requests: number;
    offers: number;
    catalogProducts: number;
    catalogOrders: number;
    requestDealOrders: number;
    conversations: number;
    notifications: number;
    categories: number;
  };
};

export type AdminUserRecord = {
  id: string;
  name?: string;
  email?: string;
  role?: "buyer" | "seller" | "admin";
  status?: "active" | "blocked" | "suspended";
};

export async function fetchAdminPlatformReport(): Promise<AdminPlatformReport> {
  return apiFetchWithRefresh<AdminPlatformReport>("/api/v1/admin/reports/overview", {
    service: "admin",
  });
}

export async function fetchAdminDatabaseStats(): Promise<DatabaseStats> {
  return apiFetchWithRefresh<DatabaseStats>("/api/v1/admin/database/stats", {
    service: "admin",
  });
}

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

export async function fetchAdminUsers(
  page = 1,
  limit = 20,
  filters?: { search?: string; role?: string; status?: string },
): Promise<{ users: AdminUserRecord[]; meta: PageMeta }> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters?.search?.trim()) qs.set("search", filters.search.trim());
  if (filters?.role) qs.set("role", filters.role);
  if (filters?.status) qs.set("status", filters.status);
  return apiFetchWithRefresh<{ users: AdminUserRecord[]; meta: PageMeta }>(
    `/api/v1/auth/admin/users?${qs.toString()}`,
    { service: "auth" },
  );
}

export async function patchAdminUser(
  id: string,
  body: Partial<{ name: string; email: string; role: AdminUserRecord["role"]; status: AdminUserRecord["status"] }>,
): Promise<AdminUserRecord> {
  const data = await apiFetchWithRefresh<{ user: AdminUserRecord }>(
    `/api/v1/auth/admin/users/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      service: "auth",
      body: JSON.stringify(body),
    },
  );
  return data.user;
}

export async function revokeAdminUserSessions(id: string): Promise<void> {
  await apiFetchWithRefresh(`/api/v1/auth/admin/users/${encodeURIComponent(id)}/revoke-sessions`, {
    method: "POST",
    service: "auth",
  });
}

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

export async function deleteAdminCatalogOrder(id: string): Promise<void> {
  await apiFetchWithRefresh(`/api/v1/admin/catalog-orders/${encodeURIComponent(id)}`, {
    method: "DELETE",
    service: "admin",
  });
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
