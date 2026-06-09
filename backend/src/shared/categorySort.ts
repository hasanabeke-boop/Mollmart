const OTHER_CATEGORY_SLUG = 'other';

export function sortCategoriesWithOtherLast<T extends { slug: string; name: string }>(
  categories: T[]
): T[] {
  const rest = categories
    .filter((c) => c.slug !== OTHER_CATEGORY_SLUG)
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  const other = categories.filter((c) => c.slug === OTHER_CATEGORY_SLUG);
  return [...rest, ...other];
}
