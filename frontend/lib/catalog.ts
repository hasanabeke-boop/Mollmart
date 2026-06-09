import { apiFetchWithRefresh } from "@/lib/api";
import { DEFAULT_CURRENCY } from "@/lib/currency";

/** Upper bound for the catalog price filter sliders (not a product price cap). */
export const PRICE_FILTER_MAX = 1_000_000;

/** All catalog prices are stored and displayed in KZT. */
export function normalizeCatalogCurrencyCode(_raw?: string | null): string {
  return DEFAULT_CURRENCY;
}

export function formatCatalogMoney(amount: number, _currency?: string, fractionDigits: 0 | 2 = 0) {
  try {
    return new Intl.NumberFormat("kk-KZ", {
      style: "currency",
      currency: DEFAULT_CURRENCY,
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits === 2 ? 2 : 0,
    }).format(amount);
  } catch {
    return fractionDigits === 2
      ? `${amount.toFixed(2)} ${DEFAULT_CURRENCY}`
      : `${Math.round(amount)} ${DEFAULT_CURRENCY}`;
  }
}

export async function uploadCatalogImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const data = await apiFetchWithRefresh<{ url: string }>("/api/v1/catalog/upload", {
    method: "POST",
    body,
    service: "catalog",
  });
  if (!data.url) {
    throw new Error("Upload did not return a URL");
  }
  return data.url;
}
