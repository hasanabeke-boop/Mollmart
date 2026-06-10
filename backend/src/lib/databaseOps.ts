import type { PrismaClient } from '@prisma/client';
import prisma from '../config/prisma';

export const DB_WIPE_CONFIRM_PHRASE = 'WIPE_MOLLMART_DATA';

const CATEGORY_SEED = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Home', slug: 'home' },
  { name: 'Home & Furniture', slug: 'home-furniture' },
  { name: 'Fashion & Apparel', slug: 'fashion' },
  { name: 'Collectibles', slug: 'collectibles' },
  { name: 'Services', slug: 'services' },
  { name: 'Sustainability', slug: 'sustainability' },
  { name: 'Other', slug: 'other' }
] as const;

export type DatabaseTableStat = {
  table: string;
  rowEstimate: number;
};

export type DatabaseStats = {
  connected: boolean;
  databaseName: string;
  databaseSizeBytes: number;
  databaseSizeHuman: string;
  checkedAt: string;
  tables: DatabaseTableStat[];
  totals: {
    users: number;
    requests: number;
    offers: number;
    catalogProducts: number;
    catalogOrders: number;
    requestDealOrders: number;
    conversations: number;
    notifications: number;
    categories: number;
  };
};

function assertWipeAllowed(confirmPhrase: string | undefined): void {
  if (confirmPhrase !== DB_WIPE_CONFIRM_PHRASE) {
    throw new Error(
      `Refusing wipe: set DB_WIPE_CONFIRM=${DB_WIPE_CONFIRM_PHRASE} and run again.`
    );
  }
}

export async function seedCategories(client: PrismaClient = prisma): Promise<number> {
  let count = 0;
  for (const category of CATEGORY_SEED) {
    await client.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, isActive: true },
      create: category
    });
    count += 1;
  }
  return count;
}

export async function getDatabaseStats(client: PrismaClient = prisma): Promise<DatabaseStats> {
  const checkedAt = new Date().toISOString();

  const [dbMeta, tableRows, users, requests, offers, catalogProducts, catalogOrders, requestDealOrders, conversations, notifications, categories] =
    await Promise.all([
      client.$queryRaw<Array<{ database_name: string; database_size_bytes: bigint }>>`
        SELECT current_database()::text AS database_name,
               pg_database_size(current_database()) AS database_size_bytes
      `,
      client.$queryRaw<Array<{ relname: string; n_live_tup: bigint }>>`
        SELECT relname, n_live_tup
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY relname
      `,
      client.user.count(),
      client.request.count(),
      client.offer.count(),
      client.catalogProduct.count(),
      client.catalogOrder.count(),
      client.requestDealOrder.count(),
      client.conversation.count(),
      client.notification.count(),
      client.category.count()
    ]);

  const meta = dbMeta[0];
  const databaseSizeBytes = Number(meta?.database_size_bytes ?? 0);

  return {
    connected: true,
    databaseName: meta?.database_name ?? 'unknown',
    databaseSizeBytes,
    databaseSizeHuman: formatBytes(databaseSizeBytes),
    checkedAt,
    tables: tableRows.map((row) => ({
      table: row.relname,
      rowEstimate: Number(row.n_live_tup)
    })),
    totals: {
      users,
      requests,
      offers,
      catalogProducts,
      catalogOrders,
      requestDealOrders,
      conversations,
      notifications,
      categories
    }
  };
}

export async function wipeApplicationData(
  confirmPhrase: string | undefined,
  client: PrismaClient = prisma
): Promise<{ tablesTruncated: number; categoriesSeeded: number }> {
  assertWipeAllowed(confirmPhrase);

  const tables = await client.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;

  if (tables.length === 0) {
    const categoriesSeeded = await seedCategories(client);
    return { tablesTruncated: 0, categoriesSeeded };
  }

  const tableList = tables.map((t) => `"${t.tablename.replace(/"/g, '""')}"`).join(', ');
  await client.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);

  const categoriesSeeded = await seedCategories(client);
  return { tablesTruncated: tables.length, categoriesSeeded };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
