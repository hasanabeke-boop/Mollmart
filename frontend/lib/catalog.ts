import { apiFetchWithRefresh } from "@/lib/api";

export const CATALOG_CURRENCIES = [
  { code: "USD", label: "USD ($)" },
  { code: "EUR", label: "EUR (€)" },
  { code: "RUB", label: "RUB (₽)" },
  { code: "KZT", label: "KZT (₸)" },
] as const;

const CATALOG_CURRENCY_CODES = new Set<string>(CATALOG_CURRENCIES.map((c) => c.code));

/** Valid catalog display / listing currency from query or UI; defaults to USD. */
export function normalizeCatalogCurrencyCode(raw: string | null | undefined): string {
  const v = (raw ?? "").trim().toUpperCase();
  return CATALOG_CURRENCY_CODES.has(v) ? v : "USD";
}

/** Upper bound for the catalog price filter sliders (not a product price cap). */
export const PRICE_FILTER_MAX = 1_000_000;

function localeForCurrency(currency: string): string {
  switch (currency) {
    case "EUR":
      return "de-DE";
    case "RUB":
      return "ru-RU";
    case "KZT":
      return "ru-KZ";
    default:
      return "en-US";
  }
}

export function formatCatalogMoney(amount: number, currency: string, fractionDigits: 0 | 2 = 0) {
  try {
    return new Intl.NumberFormat(localeForCurrency(currency), {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits === 2 ? 2 : 0,
    }).format(amount);
  } catch {
    return fractionDigits === 2 ? `${amount.toFixed(2)} ${currency}` : `${Math.round(amount)} ${currency}`;
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
