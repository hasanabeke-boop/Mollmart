import { CatalogProductStatus, Prisma } from '@prisma/client';
import type { AuthUser } from '../../request/types/express';
import { badRequest, forbidden, notFound } from '../../request/utils/apiError';
import CatalogRepository, {
  type CatalogDetailRow,
  type CatalogListRow
} from '../repositories/catalog.repository';
import type { CatalogListQuery, CreateCatalogProductInput, UpdateCatalogProductInput } from '../types/catalog';
import { uniqueCatalogSlug } from '../utils/slug';
import { convertUsdQuoted, getUsdQuoteRates, roundCatalogMoney, type UsdQuoteRates } from './exchangeRates';
import { getBuyerRecommendedCategoryUuids } from '../../recommendations/recommendationSignals';
import { buildPageMeta, normalizeLimit, normalizePage } from '../../request/utils/pagination';

const DISPLAY_CURRENCIES = ['USD', 'EUR', 'RUB', 'KZT'] as const;

function buildNativePriceOrFilter(
  minD: number | undefined,
  maxD: number | undefined,
  display: string,
  rates: UsdQuoteRates
): Prisma.CatalogProductWhereInput | undefined {
  const hasMin = minD != null && !Number.isNaN(minD);
  const hasMax = maxD != null && !Number.isNaN(maxD);
  if (!hasMin && !hasMax) {
    return undefined;
  }
  const d = display.toUpperCase();
  const rD = rates[d];
  if (rD == null || rD <= 0) {
    return undefined;
  }

  let minUsd: number | undefined;
  let maxUsd: number | undefined;
  if (hasMin) {
    minUsd = minD! / rD;
  }
  if (hasMax) {
    maxUsd = maxD! / rD;
  }

  const or: Prisma.CatalogProductWhereInput[] = [];
  for (const cur of DISPLAY_CURRENCIES) {
    const rCur = rates[cur];
    if (rCur == null || rCur <= 0) {
      continue;
    }

    const priceFilter: Prisma.DecimalFilter = {};
    if (minUsd != null) {
      priceFilter.gte = minUsd * rCur;
    }
    if (maxUsd != null) {
      priceFilter.lte = maxUsd * rCur;
    }
    if (Object.keys(priceFilter).length === 0) {
      continue;
    }

    or.push({
      AND: [{ currency: cur }, { price: priceFilter }]
    });
  }

  return or.length > 0 ? { OR: or } : undefined;
}

export class CatalogService {
  constructor(private readonly repo: CatalogRepository) {}

  async listCategories() {
    return this.repo.listActiveCategories();
  }

  async listPublished(query: CatalogListQuery) {
    const q = query.q != null && query.q.trim().length > 0 ? query.q.trim() : undefined;
    const categoryId =
      query.categoryId != null && query.categoryId.trim().length > 0 ? query.categoryId.trim() : undefined;
    const displayCurrency =
      query.currency != null && query.currency.trim().length === 3
        ? query.currency.trim().toUpperCase()
        : 'USD';

    const rates = await getUsdQuoteRates();
    const andPriceFilter = buildNativePriceOrFilter(query.minPrice, query.maxPrice, displayCurrency, rates);

    const result = await this.repo.listPublished({
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      q,
      categoryId,
      andPriceFilter
    });

    return {
      items: result.items.map((row) => this.serializeListRow(row, { displayCurrency, rates })),
      meta: result.meta
    };
  }

  async listRecommendedForUser(user: AuthUser, query: CatalogListQuery) {
    const q = query.q != null && query.q.trim().length > 0 ? query.q.trim() : undefined;
    const displayCurrency =
      query.currency != null && query.currency.trim().length === 3
        ? query.currency.trim().toUpperCase()
        : 'USD';

    const rates = await getUsdQuoteRates();
    const andPriceFilter = buildNativePriceOrFilter(query.minPrice, query.maxPrice, displayCurrency, rates);

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
      andPriceFilter
    });

    return {
      items: result.items.map((row) => this.serializeListRow(row, { displayCurrency, rates })),
      meta: result.meta,
      hasRecommendationSignals: true
    };
  }

  async getPublishedBySlug(slug: string, displayCurrency?: string) {
    const row = await this.repo.findPublishedBySlug(slug);
    if (row == null) {
      throw notFound('Product not found');
    }
    const d =
      displayCurrency != null && displayCurrency.trim().length === 3
        ? displayCurrency.trim().toUpperCase()
        : 'USD';
    const rates = await getUsdQuoteRates();
    return this.serializeDetail(row, { displayCurrency: d, rates });
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
      currency: input.currency.trim().toUpperCase(),
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
    if (input.currency !== undefined) {
      data.currency = input.currency.trim().toUpperCase();
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

  private serializeListRow(
    row: CatalogListRow,
    convert?: { displayCurrency: string; rates: UsdQuoteRates }
  ) {
    const listedPrice = Number(row.price);
    const listedCompare =
      row.compareAtPrice != null && !Number.isNaN(Number(row.compareAtPrice))
        ? Number(row.compareAtPrice)
        : null;

    if (convert == null) {
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

    const native = row.currency.trim().toUpperCase();
    const to = convert.displayCurrency.trim().toUpperCase();
    const { rates } = convert;

    let price = listedPrice;
    let compareAt = listedCompare;
    if (native !== to) {
      price = roundCatalogMoney(convertUsdQuoted(listedPrice, native, to, rates));
      compareAt =
        listedCompare != null
          ? roundCatalogMoney(convertUsdQuoted(listedCompare, native, to, rates))
          : null;
    } else {
      price = roundCatalogMoney(listedPrice);
      compareAt = listedCompare != null ? roundCatalogMoney(listedCompare) : null;
    }

    const base = {
      id: row.id,
      sellerId: row.sellerId,
      title: row.title,
      description: row.description,
      categoryId: row.categoryId,
      category: row.category,
      slug: row.slug,
      price,
      compareAtPrice: compareAt,
      currency: to,
      imageUrl: row.imageUrl,
      galleryUrls: this.galleryArray(row.galleryUrls),
      quantity: row.quantity,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };

    if (native !== to) {
      return { ...base, listedPrice, listedCurrency: row.currency };
    }
    return base;
  }

  private serializeDetail(
    row: CatalogDetailRow,
    convert?: { displayCurrency: string; rates: UsdQuoteRates }
  ) {
    return {
      ...this.serializeListRow(row, convert),
      seller: row.seller
    };
  }
}

export default CatalogService;
