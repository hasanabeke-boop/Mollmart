/** Default listing currency for Kazakhstan-focused marketplace */
export const DEFAULT_CURRENCY = "KZT" as const;

export function normalizeCurrency(code?: string | null): string {
  return DEFAULT_CURRENCY;
}

export function formatMoney(
  amount: number,
  _currency?: string | null,
  options?: { maximumFractionDigits?: number },
): string {
  const digits = options?.maximumFractionDigits ?? 0;
  try {
    return new Intl.NumberFormat("kk-KZ", {
      style: "currency",
      currency: DEFAULT_CURRENCY,
      maximumFractionDigits: digits,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${DEFAULT_CURRENCY} ${amount.toLocaleString()}`;
  }
}
