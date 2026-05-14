import prisma from '../../config/prisma';

type CatRow = { id: string; slug: string };

function readRecommendedCategoryIds(prefs: unknown): string[] {
  if (prefs == null || typeof prefs !== 'object') {
    return [];
  }
  const raw = (prefs as Record<string, unknown>).recommendedCategoryIds;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((x) => String(x)).filter((s) => s.trim().length > 0);
}

export function resolveToCategoryUuid(raw: string, categories: CatRow[]): string | null {
  const t = raw.trim();
  if (t.length === 0) {
    return null;
  }
  if (categories.some((c) => c.id === t)) {
    return t;
  }
  const bySlug = categories.find((c) => c.slug === t);
  return bySlug?.id ?? null;
}

/** Request rows may store either Category.id or Category.slug as categoryId. */
export function expandRequestCategoryKeys(categories: CatRow[], canonicalIds: Set<string>): string[] {
  const keys = new Set<string>();
  for (const id of canonicalIds) {
    const row = categories.find((c) => c.id === id);
    if (row != null) {
      keys.add(row.id);
      keys.add(row.slug);
    }
  }
  return [...keys];
}

async function loadActiveCategoryIdSlug(): Promise<CatRow[]> {
  return prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, slug: true }
  });
}

/** Canonical category UUIDs for catalog product filtering. */
export async function getBuyerRecommendedCategoryUuids(userId: string): Promise<string[]> {
  const categories = await loadActiveCategoryIdSlug();
  const ids = new Set<string>();

  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    include: { buyerProfile: true }
  });
  for (const raw of readRecommendedCategoryIds(profile?.buyerProfile?.preferencesJson)) {
    const id = resolveToCategoryUuid(raw, categories);
    if (id != null) {
      ids.add(id);
    }
  }

  const reqs = await prisma.request.findMany({
    where: {
      buyerId: userId,
      status: { notIn: ['draft', 'cancelled'] }
    },
    select: { categoryId: true }
  });
  for (const r of reqs) {
    const id = resolveToCategoryUuid(r.categoryId, categories);
    if (id != null) {
      ids.add(id);
    }
  }

  return [...ids];
}

/** Values to match Request.categoryId (slug or id). */
export async function getSellerRequestRecommendationCategoryKeys(userId: string): Promise<string[]> {
  const categories = await loadActiveCategoryIdSlug();
  const canonical = new Set<string>();

  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    include: { sellerProfile: true }
  });
  for (const raw of readRecommendedCategoryIds(profile?.sellerProfile?.preferencesJson)) {
    const id = resolveToCategoryUuid(raw, categories);
    if (id != null) {
      canonical.add(id);
    }
  }

  const products = await prisma.catalogProduct.findMany({
    where: { sellerId: userId, status: 'published' },
    select: { categoryId: true },
    distinct: ['categoryId']
  });
  for (const p of products) {
    const id = resolveToCategoryUuid(p.categoryId, categories);
    if (id != null) {
      canonical.add(id);
    }
  }

  return expandRequestCategoryKeys(categories, canonical);
}
