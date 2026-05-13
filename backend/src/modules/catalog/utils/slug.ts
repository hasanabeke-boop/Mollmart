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
  return `${slugifyTitle(title)}-${randomBytes(4).toString('hex')}`;
}
