"use client";

import { useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getLandingCopy, type LandingCopy } from "@/lib/landingI18n";

export function useLandingCopy(): LandingCopy {
  const { language } = useLanguage();
  return useMemo(() => getLandingCopy(language), [language]);
}
