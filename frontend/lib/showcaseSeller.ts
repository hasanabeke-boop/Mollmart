import { apiFetchWithRefresh } from "@/lib/api";

export type ShowcaseMineProduct = {
  id: string;
  slug: string;
  title: string;
  description: string;
  categoryId: string;
  category: { id: string; name: string; slug: string } | null;
  imageUrl: string;
  galleryUrls: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ShowcasePageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function fetchMyShowcasePage(page: number, limit = 12) {
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  return apiFetchWithRefresh<{ items: ShowcaseMineProduct[]; meta: ShowcasePageMeta }>(
    `/api/v1/catalog/products/mine?${qs.toString()}`,
    { service: "catalog" },
  );
}

export async function patchShowcaseProduct(id: string, body: Record<string, unknown>) {
  return apiFetchWithRefresh<ShowcaseMineProduct>(`/api/v1/catalog/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    service: "catalog",
    body: JSON.stringify(body),
  });
}

export async function deleteShowcaseProduct(id: string) {
  return apiFetchWithRefresh<{ outcome: "deleted" | "archived" }>(
    `/api/v1/catalog/products/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      service: "catalog",
    },
  );
}
