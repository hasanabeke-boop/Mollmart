import { apiFetchWithRefresh } from "@/lib/api";

export type SellerListingProduct = {
  id: string;
  slug: string;
  title: string;
  description: string;
  categoryId: string;
  category: { id: string; name: string; slug: string } | null;
  imageUrl: string;
  galleryUrls: string[];
  price: number;
  compareAtPrice: number | null;
  currency: string;
  quantity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type SellerListingPageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function fetchMyListingsPage(page: number, limit = 12) {
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  return apiFetchWithRefresh<{ items: SellerListingProduct[]; meta: SellerListingPageMeta }>(
    `/api/v1/catalog/products/mine?${qs.toString()}`,
    { service: "catalog" },
  );
}

export async function patchListingProduct(id: string, body: Record<string, unknown>) {
  return apiFetchWithRefresh<SellerListingProduct>(`/api/v1/catalog/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    service: "catalog",
    body: JSON.stringify(body),
  });
}

export async function deleteListingProduct(id: string) {
  return apiFetchWithRefresh<{ outcome: "deleted" | "archived" }>(
    `/api/v1/catalog/products/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      service: "catalog",
    },
  );
}
