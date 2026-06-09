"use client";

import { useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translateCategoryName, translateCategoryRef, type CategoryRef } from "@/lib/categoryI18n";

export function useCategoryLabel() {
  const { language } = useLanguage();

  return useCallback(
    (nameOrCategory: string | CategoryRef, slug?: string) => {
      if (typeof nameOrCategory === "string") {
        return translateCategoryName(nameOrCategory, language, slug);
      }
      return translateCategoryRef(nameOrCategory, language);
    },
    [language],
  );
}
