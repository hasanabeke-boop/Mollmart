import { Router } from 'express';
import asyncHandler from '../../../request/utils/asyncHandler';
import { getUsdQuoteRates } from '../../../catalog/services/exchangeRates';

const router = Router();

type CacheEntry = { at: number; body: { base: string; rates: Record<string, number>; fetchedAt: string } };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 60 * 60 * 1000;

const SUPPORTED = ['USD', 'EUR', 'RUB', 'KZT'] as const;

/** Build rates as "units of X per 1 `base`" (same shape exchangerate.host used to return). */
function ratesPerOneBase(base: string, usdQuoted: Record<string, number>): Record<string, number> | null {
  const b = base.toUpperCase();
  const basePerUsd = usdQuoted[b];
  if (basePerUsd == null || !(basePerUsd > 0)) {
    return null;
  }
  const out: Record<string, number> = {};
  for (const cur of SUPPORTED) {
    const v = usdQuoted[cur];
    if (v == null || !(v > 0)) {
      return null;
    }
    out[cur] = v / basePerUsd;
  }
  return out;
}

router.get(
  '/rates',
  asyncHandler(async (req, res) => {
    const raw = typeof req.query.base === 'string' ? req.query.base : 'KZT';
    const base = raw.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'KZT';
    if (base.length !== 3 || !SUPPORTED.includes(base as (typeof SUPPORTED)[number])) {
      res.status(400).json({ error: 'base must be one of USD, EUR, RUB, KZT' });
      return;
    }

    const now = Date.now();
    const hit = cache.get(base);
    if (hit != null && now - hit.at < TTL_MS) {
      res.json(hit.body);
      return;
    }

    const usdQuoted = await getUsdQuoteRates();
    const rates = ratesPerOneBase(base, usdQuoted);
    if (rates == null) {
      res.status(502).json({ error: 'FX rates unavailable' });
      return;
    }

    const body = { base, rates, fetchedAt: new Date().toISOString() };
    cache.set(base, { at: now, body });
    res.json(body);
  })
);

export default router;
