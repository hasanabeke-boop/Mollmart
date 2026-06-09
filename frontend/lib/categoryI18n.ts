import { translateUiText, type Language } from "@/lib/i18n";

export type CategoryRef = { name: string; slug?: string };

/** Localized labels keyed by stable category slug (seed + admin slugs). */
const bySlug: Record<Language, Record<string, string>> = {
  en: {
    electronics: "Electronics",
    home: "Home",
    "home-furniture": "Home & Furniture",
    fashion: "Fashion & Apparel",
    collectibles: "Collectibles",
    services: "Services",
    sustainability: "Sustainability",
    other: "Other",
  },
  ru: {
    electronics: "Электроника",
    home: "Товары для дома",
    "home-furniture": "Дом и мебель",
    fashion: "Мода и одежда",
    collectibles: "Коллекционные товары",
    services: "Услуги",
    sustainability: "Экология и устойчивость",
    other: "Другое",
  },
  kk: {
    electronics: "Электроника",
    home: "Үйге арналған тауарлар",
    "home-furniture": "Үй және жиһаз",
    fashion: "Сән және киім",
    collectibles: "Коллекциялық заттар",
    services: "Қызметтер",
    sustainability: "Экология және тұрақтылық",
    other: "Басқа",
  },
};

/** Fallback when only the English DB name is available (legacy rows, API payloads). */
const byEnglishName: Record<Exclude<Language, "en">, Record<string, string>> = {
  ru: {
    Electronics: "Электроника",
    Home: "Товары для дома",
    "Home & Furniture": "Дом и мебель",
    "Home & Garden": "Дом и сад",
    "Fashion & Apparel": "Мода и одежда",
    Collectibles: "Коллекционные товары",
    Services: "Услуги",
    Sustainability: "Экология и устойчивость",
    Other: "Другое",
    Uncategorized: "Без категории",
    Category: "Категория",
  },
  kk: {
    Electronics: "Электроника",
    Home: "Үйге арналған тауарлар",
    "Home & Furniture": "Үй және жиһаз",
    "Home & Garden": "Үй және бақ",
    "Fashion & Apparel": "Сән және киім",
    Collectibles: "Коллекциялық заттар",
    Services: "Қызметтер",
    Sustainability: "Экология және тұрақтылық",
    Other: "Басқа",
    Uncategorized: "Санатсыз",
    Category: "Санат",
  },
};

function normalizeSlug(slug: string | undefined): string | undefined {
  const s = slug?.trim().toLowerCase();
  return s || undefined;
}

export function translateCategoryName(
  name: string,
  language: Language,
  slug?: string,
): string {
  const trimmed = name.trim();
  if (!trimmed) return translateUiText("Category", language);

  if (language === "en") return trimmed;

  const slugKey = normalizeSlug(slug);
  if (slugKey && bySlug[language][slugKey]) {
    return bySlug[language][slugKey];
  }

  const byName = byEnglishName[language][trimmed];
  if (byName) return byName;

  const fromDictionary = translateUiText(trimmed, language);
  if (fromDictionary !== trimmed) return fromDictionary;

  return trimmed;
}

export function translateCategoryRef(category: CategoryRef, language: Language): string {
  return translateCategoryName(category.name, language, category.slug);
}

const OTHER_CATEGORY_SLUG = "other";

export function isOtherCategorySlug(slug: string | undefined): boolean {
  return normalizeSlug(slug) === OTHER_CATEGORY_SLUG;
}

/** Keep "Other" / "Другое" last regardless of alphabetical order. */
export function sortCategoriesWithOtherLast<T extends { slug: string }>(categories: T[]): T[] {
  const rest = categories.filter((c) => !isOtherCategorySlug(c.slug));
  const other = categories.filter((c) => isOtherCategorySlug(c.slug));
  return [...rest, ...other];
}
