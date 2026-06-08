/** Default listing currency for Kazakhstan-focused marketplace */
export const DEFAULT_CURRENCY = "KZT" as const;

export const SELECTABLE_CURRENCIES = [
  { code: "KZT", label: "KZT — ₸ тенге" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "RUB", label: "RUB — Russian Ruble" },
] as const;

export function normalizeCurrency(code?: string | null): string {
  const c = (code || DEFAULT_CURRENCY).toString().trim().toUpperCase().slice(0, 3);
  return c.length === 3 ? c : DEFAULT_CURRENCY;
}

export function formatMoney(
  amount: number,
  currency?: string | null,
  options?: { maximumFractionDigits?: number },
): string {
  const c = normalizeCurrency(currency);
  const digits = options?.maximumFractionDigits ?? (c === "KZT" ? 0 : 2);
  try {
    return new Intl.NumberFormat("kk-KZ", {
      style: "currency",
      currency: c,
      maximumFractionDigits: digits,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${c} ${amount.toLocaleString()}`;
  }
}
