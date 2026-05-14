import { Router } from 'express';
import asyncHandler from '../../../request/utils/asyncHandler';

const router = Router();

type CacheEntry = { at: number; body: { base: string; rates: Record<string, number>; fetchedAt: string } };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 60 * 60 * 1000;

router.get(
  '/rates',
  asyncHandler(async (req, res) => {
    const raw = typeof req.query.base === 'string' ? req.query.base : 'KZT';
    const base = raw.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'KZT';
    if (base.length !== 3) {
      res.status(400).json({ error: 'base must be a 3-letter ISO currency code' });
      return;
    }

    const now = Date.now();
    const hit = cache.get(base);
    if (hit != null && now - hit.at < TTL_MS) {
      res.json(hit.body);
      return;
    }

    const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}`;
    const upstream = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!upstream.ok) {
      res.status(502).json({ error: 'FX provider HTTP error', status: upstream.status });
      return;
    }

    const json = (await upstream.json()) as { success?: boolean; rates?: Record<string, number> };
    if (!json.success || json.rates == null || typeof json.rates !== 'object') {
      res.status(502).json({ error: 'FX provider returned invalid data' });
      return;
    }

    const body = { base, rates: json.rates, fetchedAt: new Date().toISOString() };
    cache.set(base, { at: now, body });
    res.json(body);
  })
);

export default router;
