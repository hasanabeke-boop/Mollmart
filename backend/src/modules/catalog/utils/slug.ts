import { randomBytes } from 'crypto';

export function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base.length > 0 ? base.slice(0, 80) : 'product';
}

export function uniqueCatalogSlug(title: string): string {
  return `${slugifyTitle(title)}-${randomBytes(4).toString('hex')}`.normalize('NFC');
}

/** Decode path param and normalize Unicode for consistent DB lookup. */
export function normalizeSlugParam(slug: string): string {
  let s = slug.trim();
  try {
    for (let i = 0; i < 2; i += 1) {
      if (!/%[0-9A-Fa-f]{2}/.test(s)) {
        break;
      }
      const decoded = decodeURIComponent(s);
      if (decoded === s) {
        break;
      }
      s = decoded;
    }
  } catch {
    // keep original
  }
  return s.normalize('NFC');
}
