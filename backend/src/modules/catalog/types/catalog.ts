export type CatalogListQuery = {
  page: number;
  limit: number;
  q?: string;
  categoryId?: string;
  currency?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
};

export type CreateCatalogProductInput = {
  title: string;
  description: string;
  categoryId: string;
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  imageUrl: string;
  galleryUrls?: string[] | null;
  quantity?: number;
  status?: 'draft' | 'published' | 'archived';
};

export type UpdateCatalogProductInput = Partial<CreateCatalogProductInput>;
