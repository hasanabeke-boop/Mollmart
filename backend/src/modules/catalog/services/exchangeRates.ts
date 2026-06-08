/** Units of currency X per 1 USD (same convention as open.er-api.com). */
export type UsdQuoteRates = Record<string, number>;

const CACHE_TTL_MS = 60 * 60 * 1000;

const OPEN_ER_USD = 'https://open.er-api.com/v6/latest/USD';

const REQUIRED = ['USD', 'EUR', 'RUB', 'KZT'] as const;

const FALLBACK: UsdQuoteRates = {
  USD: 1,
  EUR: 0.92,
  RUB: 90,
  KZT: 450
};

type CacheEntry = { rates: UsdQuoteRates; fetchedAt: number };
let cache: CacheEntry | null = null;

function pickRequired(rates: Record<string, number>): UsdQuoteRates | null {
  const out: UsdQuoteRates = { ...rates };
  out.USD = typeof out.USD === 'number' && out.USD > 0 ? out.USD : 1;
  for (const c of REQUIRED) {
    const v = out[c];
    if (typeof v !== 'number' || !(v > 0)) {
      return null;
    }
  }
  return out;
}

export async function getUsdQuoteRates(): Promise<UsdQuoteRates> {
  if (cache != null && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rates;
  }

  try {
    const res = await fetch(OPEN_ER_USD, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) {
      throw new Error(`rates http ${res.status}`);
    }
    const body = (await res.json()) as { result?: string; rates?: Record<string, number> };
    if (body.result !== 'success' || body.rates == null) {
      throw new Error('rates payload');
    }
    const picked = pickRequired(body.rates);
    if (picked == null) {
      throw new Error('rates incomplete');
    }
    cache = { rates: picked, fetchedAt: Date.now() };
    return picked;
  } catch {
    cache = { rates: { ...FALLBACK }, fetchedAt: Date.now() };
    return cache.rates;
  }
}

/** Convert amount from `from` to `to` using USD-quoted rates (units of each currency per 1 USD). */
export function convertUsdQuoted(amount: number, from: string, to: string, rates: UsdQuoteRates): number {
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  if (f === t) {
    return amount;
  }
  const rf = rates[f];
  const rt = rates[t];
  if (rf == null || rt == null || rf <= 0 || rt <= 0) {
    return amount;
  }
  return (amount * rt) / rf;
}

export function roundCatalogMoney(n: number): number {
  return Math.round(n * 100) / 100;
}
