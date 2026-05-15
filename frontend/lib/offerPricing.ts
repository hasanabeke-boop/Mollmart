/** Offer.price is per unit; proposals and payment use line total (unit × request quantity). */

export function normalizeRequestQuantity(raw: unknown): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function computeOfferLineTotal(unitPrice: number, quantity: unknown): number {
  const unit = Number(unitPrice);
  if (!Number.isFinite(unit) || unit <= 0) return 0;
  return roundMoney(unit * normalizeRequestQuantity(quantity));
}
