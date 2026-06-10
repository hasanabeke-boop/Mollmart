import { CatalogProductStatus, Prisma } from '@prisma/client';
import type { AuthUser } from '../../request/types/express';
import { badRequest, forbidden, notFound } from '../../request/utils/apiError';
import CatalogRepository, {
  type CatalogDetailRow,
  type CatalogListRow
} from '../repositories/catalog.repository';
import type { CatalogListQuery, CreateCatalogProductInput, UpdateCatalogProductInput } from '../types/catalog';
import { uniqueCatalogSlug, normalizeSlugParam } from '../utils/slug';
import { MARKETPLACE_CURRENCY } from '../../../shared/marketplaceCurrency';
import { getBuyerRecommendedCategoryUuids } from '../../recommendations/recommendationSignals';
import { buildPageMeta, normalizeLimit, normalizePage } from '../../request/utils/pagination';

/** Hide own listings when browsing catalog as a buyer (incl. dual-workspace seller → buyer). */
function catalogExcludeSellerId(user?: AuthUser): string | undefined {
  if (user == null || user.role === 'admin') {
    return undefined;
  }
  const buyerView =
    user.role === 'buyer' ||
    user.activeMode === 'buyer' ||
    (user.canBuy === true && user.canSell === true && user.activeMode !== 'seller');
  if (buyerView) {
    return user.id;
  }
  return undefined;
}

function buildKztPriceFilter(
  minD: number | undefined,
  maxD: number | undefined
): Prisma.CatalogProductWhereInput | undefined {
  const hasMin = minD != null && !Number.isNaN(minD);
  const hasMax = maxD != null && !Number.isNaN(maxD);
  if (!hasMin && !hasMax) {
    return undefined;
  }

  const priceFilter: Prisma.DecimalFilter = {};
  if (hasMin) {
    priceFilter.gte = minD;
  }
  if (hasMax) {
    priceFilter.lte = maxD;
  }

  return { currency: MARKETPLACE_CURRENCY, price: priceFilter };
}

export class CatalogService {
  constructor(private readonly repo: CatalogRepository) {}

  async listCategories() {
    return this.repo.listActiveCategories();
  }

  async listPublished(query: CatalogListQuery, user?: AuthUser) {
    const q = query.q != null && query.q.trim().length > 0 ? query.q.trim() : undefined;
    const categoryId =
      query.categoryId != null && query.categoryId.trim().length > 0 ? query.categoryId.trim() : undefined;
    const andPriceFilter = buildKztPriceFilter(query.minPrice, query.maxPrice);

    const result = await this.repo.listPublished({
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      q,
      categoryId,
      andPriceFilter,
      excludeSellerId: catalogExcludeSellerId(user)
    });

    return {
      items: result.items.map((row) => this.serializeListRow(row)),
      meta: result.meta
    };
  }

  async listRecommendedForUser(user: AuthUser, query: CatalogListQuery) {
    const q = query.q != null && query.q.trim().length > 0 ? query.q.trim() : undefined;
    const andPriceFilter = buildKztPriceFilter(query.minPrice, query.maxPrice);

    const categoryIds = await getBuyerRecommendedCategoryUuids(user.id);
    const page = normalizePage(query.page);
    const limit = normalizeLimit(query.limit);

    if (categoryIds.length === 0) {
      return {
        items: [] as Awaited<ReturnType<CatalogService['listPublished']>>['items'],
        meta: buildPageMeta(page, limit, 0),
        hasRecommendationSignals: false
      };
    }

    const result = await this.repo.listPublished({
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      q,
      categoryIds,
      andPriceFilter,
      excludeSellerId: catalogExcludeSellerId(user)
    });

    return {
      items: result.items.map((row) => this.serializeListRow(row)),
      meta: result.meta,
      hasRecommendationSignals: true
    };
  }

  async getBySlug(slug: string, user?: AuthUser) {
    const normalized = normalizeSlugParam(slug);

    const published = await this.repo.findPublishedBySlug(normalized);
    if (published != null) {
      return this.serializeDetail(published);
    }

    if (user == null) {
      throw notFound('Product not found');
    }

    const row = await this.repo.findDetailBySlug(normalized);
    if (row == null) {
      throw notFound('Product not found');
    }

    const isOwner = row.sellerId === user.id;
    const isAdmin = user.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw notFound('Product not found');
    }

    return this.serializeDetail(row);
  }

  async listMine(user: AuthUser, page: number, limit: number) {
    const result =
      user.role === 'admin'
        ? await this.repo.listAll(page, limit)
        : await this.repo.listBySeller(user.id, page, limit);

    return {
      items: result.items.map((row) => this.serializeListRow(row)),
      meta: result.meta
    };
  }

  async create(user: AuthUser, input: CreateCatalogProductInput) {
    if (user.role !== 'seller' && user.role !== 'admin') {
      throw forbidden('Only sellers can list catalog products');
    }

    const category = await this.repo.findCategoryById(input.categoryId);
    if (category == null) {
      throw badRequest('Invalid category');
    }

    const status = this.parseStatus(input.status);

    let slug = uniqueCatalogSlug(input.title);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const taken = await this.repo.findBySlug(slug);
      if (taken == null) {
        break;
      }
      slug = uniqueCatalogSlug(input.title);
    }

    const galleryUrls =
      input.galleryUrls != null && input.galleryUrls.length > 0
        ? (input.galleryUrls as Prisma.InputJsonValue)
        : Prisma.JsonNull;

    const row = await this.repo.create({
      seller: { connect: { id: user.id } },
      category: { connect: { id: category.id } },
      title: input.title.trim(),
      description: input.description.trim(),
      slug,
      price: new Prisma.Decimal(input.price),
      compareAtPrice:
        input.compareAtPrice != null && !Number.isNaN(Number(input.compareAtPrice))
          ? new Prisma.Decimal(input.compareAtPrice)
          : null,
      currency: MARKETPLACE_CURRENCY,
      imageUrl: input.imageUrl.trim(),
      galleryUrls,
      quantity: input.quantity ?? 0,
      status
    });

    return this.serializeListRow(row);
  }

  async update(user: AuthUser, id: string, input: UpdateCatalogProductInput) {
    const current = await this.repo.findById(id);
    if (current == null) {
      throw notFound('Product not found');
    }

    if (user.role !== 'admin' && current.sellerId !== user.id) {
      throw forbidden('Not allowed to update this product');
    }

    const data: Prisma.CatalogProductUpdateInput = {};

    if (input.title !== undefined) {
      data.title = input.title.trim();
    }
    if (input.description !== undefined) {
      data.description = input.description.trim();
    }
    if (input.price !== undefined) {
      if (input.price <= 0) {
        throw badRequest('price must be greater than 0');
      }
      data.price = new Prisma.Decimal(input.price);
    }
    if (input.compareAtPrice !== undefined) {
      data.compareAtPrice =
        input.compareAtPrice == null ? null : new Prisma.Decimal(input.compareAtPrice);
    }
    if (input.currency !== undefined && input.currency.trim().toUpperCase() !== MARKETPLACE_CURRENCY) {
      throw badRequest(`Only ${MARKETPLACE_CURRENCY} is supported`);
    }
    if (input.imageUrl !== undefined) {
      data.imageUrl = input.imageUrl.trim();
    }
    if (input.galleryUrls !== undefined) {
      data.galleryUrls =
        input.galleryUrls != null && input.galleryUrls.length > 0
          ? (input.galleryUrls as Prisma.InputJsonValue)
          : Prisma.JsonNull;
    }
    if (input.status !== undefined) {
      data.status = this.parseStatus(input.status);
    }
    if (input.quantity !== undefined) {
      data.quantity = input.quantity;
    }
    if (input.categoryId !== undefined) {
      const cat = await this.repo.findCategoryById(input.categoryId);
      if (cat == null) {
        throw badRequest('Invalid category');
      }
      data.category = { connect: { id: cat.id } };
    }

    if (Object.keys(data).length === 0) {
      throw badRequest('No fields to update');
    }

    const row = await this.repo.update(id, data);
    return this.serializeListRow(row);
  }

  async remove(user: AuthUser, id: string): Promise<{ outcome: 'deleted' | 'archived' }> {
    const current = await this.repo.findById(id);
    if (current == null) {
      throw notFound('Product not found');
    }

    if (user.role !== 'admin' && current.sellerId !== user.id) {
      throw forbidden('Not allowed to delete this product');
    }

    const lines = await this.repo.countOrderLinesForProduct(id);
    if (lines > 0) {
      await this.repo.archiveById(id);
      return { outcome: 'archived' };
    }

    try {
      await this.repo.deleteById(id);
      return { outcome: 'deleted' };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2003' || error.code === 'P2014')
      ) {
        await this.repo.archiveById(id);
        return { outcome: 'archived' };
      }
      throw error;
    }
  }

  private parseStatus(s?: string | null): CatalogProductStatus {
    if (s === 'published') {
      return CatalogProductStatus.published;
    }
    if (s === 'archived') {
      return CatalogProductStatus.archived;
    }
    return CatalogProductStatus.draft;
  }

  private galleryArray(raw: unknown): string[] {
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.filter((x): x is string => typeof x === 'string');
  }

  private serializeListRow(row: CatalogListRow) {
    const listedPrice = Number(row.price);
    const listedCompare =
      row.compareAtPrice != null && !Number.isNaN(Number(row.compareAtPrice))
        ? Number(row.compareAtPrice)
        : null;

    return {
      id: row.id,
      sellerId: row.sellerId,
      title: row.title,
      description: row.description,
      categoryId: row.categoryId,
      category: row.category,
      slug: row.slug,
      price: listedPrice,
      compareAtPrice: listedCompare,
      currency: row.currency,
      imageUrl: row.imageUrl,
      galleryUrls: this.galleryArray(row.galleryUrls),
      quantity: row.quantity,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  private serializeDetail(row: CatalogDetailRow) {
    return {
      ...this.serializeListRow(row),
      seller: row.seller
    };
  }
}

export default CatalogService;
