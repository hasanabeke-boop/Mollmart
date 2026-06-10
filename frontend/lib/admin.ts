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
  isHidden?: boolean;
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

export type AdminEntityTargetType =
  | "request"
  | "offer"
  | "user"
  | "catalog_product"
  | "category"
  | "auction";

export type ModerationTargetDetails = {
  exists: boolean;
  label: string;
  subtitle?: string | null;
  status?: string | null;
  imageUrl?: string | null;
  publicPath?: string | null;
  isHidden?: boolean;
  owner?: {
    id: string;
    name: string;
    email?: string | null;
    role?: string;
  } | null;
  extra?: Record<string, string | number | boolean | null>;
};

export type ModerationCaseEnriched = {
  id: string;
  targetType: AdminEntityTargetType;
  targetId: string;
  reason: string;
  status: "open" | "in_review" | "resolved" | "dismissed";
  createdBy: string;
  assignedTo: string | null;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  target: ModerationTargetDetails;
  actions: Array<{
    id: string;
    actionType: string;
    actorId: string;
    note: string | null;
    createdAt: string;
  }>;
};

export type AdminCatalogProductRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  price: number;
  currency: string;
  quantity: number;
  imageUrl: string;
  createdAt: string;
  isHidden: boolean;
  seller: { id: string; name: string; email: string | null };
  category: { id: string; name: string; slug: string };
};

export type AdminOfferRow = {
  id: string;
  requestId: string;
  requestTitle: string;
  price: number;
  currency: string;
  status: string;
  message: string;
  createdAt: string;
  isHidden: boolean;
  seller: { id: string; name: string; email: string | null };
};

export type AdminAuctionRow = {
  id: string;
  requestId: string;
  requestTitle: string;
  status: string;
  participantCount: number;
  currentRound: number;
  leaderPrice: number | null;
  currency: string;
  createdAt: string;
  buyer: { id: string; name: string; email: string | null };
};

export async function hideAdminContent(
  targetType: AdminEntityTargetType,
  targetId: string,
  reason?: string,
): Promise<void> {
  await apiFetchWithRefresh("/api/v1/admin/content/hide", {
    method: "POST",
    service: "admin",
    body: JSON.stringify({ targetType, targetId, reason }),
  });
}

export async function unhideAdminContent(
  targetType: AdminEntityTargetType,
  targetId: string,
): Promise<void> {
  await apiFetchWithRefresh("/api/v1/admin/content/unhide", {
    method: "POST",
    service: "admin",
    body: JSON.stringify({ targetType, targetId }),
  });
}

export async function deleteAdminContent(
  targetType: AdminEntityTargetType,
  targetId: string,
): Promise<void> {
  await apiFetchWithRefresh(
    `/api/v1/admin/content/${encodeURIComponent(targetType)}/${encodeURIComponent(targetId)}`,
    { method: "DELETE", service: "admin" },
  );
}

export async function deleteAdminCategory(id: string): Promise<void> {
  await apiFetchWithRefresh(`/api/v1/admin/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
    service: "admin",
  });
}

export async function fetchAdminCatalogProducts(
  page = 1,
  limit = 20,
  q?: string,
  status?: string,
): Promise<{ items: AdminCatalogProductRow[]; meta: PageMeta }> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q?.trim()) qs.set("q", q.trim());
  if (status) qs.set("status", status);
  return apiFetchWithRefresh(`/api/v1/admin/catalog-products?${qs.toString()}`, { service: "admin" });
}

export async function fetchAdminOffers(
  page = 1,
  limit = 20,
  q?: string,
  status?: string,
): Promise<{ items: AdminOfferRow[]; meta: PageMeta }> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q?.trim()) qs.set("q", q.trim());
  if (status) qs.set("status", status);
  return apiFetchWithRefresh(`/api/v1/admin/offers?${qs.toString()}`, { service: "admin" });
}

export async function fetchAdminAuctions(
  page = 1,
  limit = 20,
  q?: string,
  status?: string,
): Promise<{ items: AdminAuctionRow[]; meta: PageMeta }> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q?.trim()) qs.set("q", q.trim());
  if (status) qs.set("status", status);
  return apiFetchWithRefresh(`/api/v1/admin/auctions?${qs.toString()}`, { service: "admin" });
}
