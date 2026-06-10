import { CatalogProductStatus, Prisma, PrismaClient } from '@prisma/client';
import prisma from '../../../config/prisma';
import { sortCategoriesWithOtherLast } from '../../../shared/categorySort';
import { isContentHidden, listHiddenContentTargetIds } from '../../../shared/contentFlags';
import { buildPageMeta, normalizeLimit, normalizePage } from '../../request/utils/pagination';
import type { CatalogListQuery } from '../types/catalog';

export type ListPublishedRepoParams = {
  page: number;
  limit: number;
  sort?: CatalogListQuery['sort'];
  q?: string;
  categoryId?: string;
  /** When set, products in any of these categories (OR). Ignores single categoryId if non-empty. */
  categoryIds?: string[];
  /** Native-currency price bands (OR across USD/EUR/RUB/KZT) matching display-currency slider bounds */
  andPriceFilter?: Prisma.CatalogProductWhereInput;
  /** Hide listings from this seller (buyer browsing own catalog in buyer workspace). */
  excludeSellerId?: string;
};

export const catalogListInclude = {
  category: { select: { id: true, name: true, slug: true } }
} satisfies Prisma.CatalogProductInclude;

export const catalogDetailInclude = {
  category: { select: { id: true, name: true, slug: true } },
  seller: { select: { id: true, name: true } }
} satisfies Prisma.CatalogProductInclude;

export type CatalogListRow = Prisma.CatalogProductGetPayload<{ include: typeof catalogListInclude }>;
export type CatalogDetailRow = Prisma.CatalogProductGetPayload<{ include: typeof catalogDetailInclude }>;

export type CatalogListResult = {
  items: CatalogListRow[];
  meta: ReturnType<typeof buildPageMeta>;
};

export class CatalogRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findCategoryById(id: string) {
    return this.client.category.findFirst({
      where: { id, isActive: true }
    });
  }

  async listActiveCategories() {
    const rows = await this.client.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, parentId: true }
    });
    return sortCategoriesWithOtherLast(rows);
  }

  async create(data: Prisma.CatalogProductCreateInput): Promise<CatalogListRow> {
    return this.client.catalogProduct.create({
      data,
      include: catalogListInclude
    });
  }

  async findById(id: string): Promise<CatalogListRow | null> {
    return this.client.catalogProduct.findUnique({
      where: { id },
      include: catalogListInclude
    });
  }

  async findBySlug(slug: string): Promise<{ id: string } | null> {
    return this.client.catalogProduct.findUnique({
      where: { slug },
      select: { id: true }
    });
  }

  async update(id: string, data: Prisma.CatalogProductUpdateInput): Promise<CatalogListRow> {
    return this.client.catalogProduct.update({
      where: { id },
      data,
      include: catalogListInclude
    });
  }

  async countOrderLinesForProduct(productId: string): Promise<number> {
    return this.client.catalogOrderLine.count({
      where: { productId }
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.client.catalogProduct.delete({
      where: { id }
    });
  }

  async archiveById(id: string): Promise<CatalogListRow> {
    return this.client.catalogProduct.update({
      where: { id },
      data: { status: CatalogProductStatus.archived },
      include: catalogListInclude
    });
  }

  async findPublishedBySlug(slug: string): Promise<CatalogDetailRow | null> {
    const row = await this.client.catalogProduct.findFirst({
      where: { slug, status: CatalogProductStatus.published },
      include: catalogDetailInclude
    });
    if (row == null) {
      return null;
    }
    if (await isContentHidden(this.client, 'catalog_product', row.id)) {
      return null;
    }
    return row;
  }

  async findDetailBySlug(slug: string): Promise<CatalogDetailRow | null> {
    return this.client.catalogProduct.findFirst({
      where: { slug },
      include: catalogDetailInclude
    });
  }

  async listPublished(query: ListPublishedRepoParams): Promise<CatalogListResult> {
    const page = normalizePage(query.page);
    const limit = normalizeLimit(query.limit);
    const hiddenProductIds = await listHiddenContentTargetIds(this.client, 'catalog_product');
    const andParts: Prisma.CatalogProductWhereInput[] = [{ status: CatalogProductStatus.published }];
    if (hiddenProductIds.length > 0) {
      andParts.push({ id: { notIn: hiddenProductIds } });
    }
    if (query.categoryIds != null && query.categoryIds.length > 0) {
      andParts.push({ categoryId: { in: query.categoryIds } });
    } else if (query.categoryId != null && query.categoryId.length > 0) {
      andParts.push({ categoryId: query.categoryId });
    }
    if (query.q != null && query.q.trim().length > 0) {
      const qv = query.q.trim();
      andParts.push({
        OR: [
          { title: { contains: qv, mode: 'insensitive' } },
          { description: { contains: qv, mode: 'insensitive' } }
        ]
      });
    }
    if (query.andPriceFilter != null) {
      andParts.push(query.andPriceFilter);
    }
    if (query.excludeSellerId != null && query.excludeSellerId.length > 0) {
      andParts.push({ sellerId: { not: query.excludeSellerId } });
    }
    const where: Prisma.CatalogProductWhereInput = andParts.length === 1 ? andParts[0]! : { AND: andParts };

    const orderBy: Prisma.CatalogProductOrderByWithRelationInput =
      query.sort === 'price_asc'
        ? { price: 'asc' }
        : query.sort === 'price_desc'
          ? { price: 'desc' }
          : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.client.catalogProduct.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: catalogListInclude
      }),
      this.client.catalogProduct.count({ where })
    ]);

    return { items, meta: buildPageMeta(page, limit, total) };
  }

  async listBySeller(sellerId: string, page: number, limit: number): Promise<CatalogListResult> {
    const p = normalizePage(page);
    const l = normalizeLimit(limit);
    const where: Prisma.CatalogProductWhereInput = { sellerId };
    const [items, total] = await Promise.all([
      this.client.catalogProduct.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
        include: catalogListInclude
      }),
      this.client.catalogProduct.count({ where })
    ]);
    return { items, meta: buildPageMeta(p, l, total) };
  }

  async listAll(page: number, limit: number): Promise<CatalogListResult> {
    const p = normalizePage(page);
    const l = normalizeLimit(limit);
    const where: Prisma.CatalogProductWhereInput = {};
    const [items, total] = await Promise.all([
      this.client.catalogProduct.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
        include: catalogListInclude
      }),
      this.client.catalogProduct.count({ where })
    ]);
    return { items, meta: buildPageMeta(p, l, total) };
  }
}

export default CatalogRepository;
