import config from '../../../config/config';

export function normalizePage(value: number | undefined): number {
  if (value == null || Number.isNaN(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

export function normalizeLimit(value: number | undefined): number {
  if (value == null || Number.isNaN(value) || value < 1) {
    return config.pagination.defaultPageSize;
  }

  return Math.min(Math.floor(value), config.pagination.maxPageSize);
}

export function buildPageMeta(page: number, limit: number, total: number): {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
} {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit)
  };
}
