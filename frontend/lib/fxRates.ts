import { API_BASE } from "./api";

export type FxRatesResponse = {
  base: string;
  rates: Record<string, number>;
  fetchedAt: string;
};

const FX_CACHE_TTL_MS = 60 * 60 * 1000;
const fxCache = new Map<string, { expiresAt: number; promise: Promise<FxRatesResponse> }>();

/** Cached ~1h on server; safe to call from UI for hints. */
export async function fetchLatestRates(base = "KZT"): Promise<FxRatesResponse> {
  const normalizedBase = base.toUpperCase().slice(0, 3) || "KZT";
  const cached = fxCache.get(normalizedBase);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  const promise = (async () => {
    const u = `${API_BASE}/api/v1/currency/rates?base=${encodeURIComponent(normalizedBase)}`;
    const res = await fetch(u);
    const data = (await res.json().catch(() => ({}))) as FxRatesResponse & { error?: string };
    if (!res.ok) {
      throw new Error(data.error || `FX rates failed (${res.status})`);
    }
    return data;
  })();

  fxCache.set(normalizedBase, { expiresAt: Date.now() + FX_CACHE_TTL_MS, promise });
  promise.catch(() => {
    if (fxCache.get(normalizedBase)?.promise === promise) {
      fxCache.delete(normalizedBase);
    }
  });
  return promise;
}

/**
 * Convert amount from currency `from` to `to` using rates where 1 `base` = rates[X] X.
 * Example: base KZT, rates.USD = USD per 1 KZT.
 */
export function convertViaBase(
  amount: number,
  from: string,
  to: string,
  base: string,
  rates: Record<string, number>,
): number | null {
  const f = from.toUpperCase().slice(0, 3);
  const t = to.toUpperCase().slice(0, 3);
  const b = base.toUpperCase().slice(0, 3);
  if (f === t) return amount;
  if (!Number.isFinite(amount) || amount <= 0) return null;

  let inBase: number;
  if (f === b) {
    inBase = amount;
  } else {
    const rf = rates[f];
    if (rf == null || rf === 0) return null;
    inBase = amount / rf;
  }

  if (t === b) {
    return inBase;
  }
  const rt = rates[t];
  if (rt == null) return null;
  return inBase * rt;
}
