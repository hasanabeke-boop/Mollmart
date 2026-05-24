"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetchWithRefresh } from "@/lib/api";
import {
  defaultLanguage,
  languageLabels,
  languageNames,
  languages,
  normalizeLanguage,
  translateUiText,
  type Language,
} from "@/lib/i18n";

const LANGUAGE_STORAGE_KEY = "mollmart_language";

type LanguageState = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (text: string) => string;
};

const LanguageContext = createContext<LanguageState | null>(null);

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return defaultLanguage;

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) return normalizeLanguage(stored);
  } catch {
    // Storage can be blocked in private contexts.
  }

  return normalizeLanguage(window.navigator.language);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => getInitialLanguage());

  useEffect(() => {
    const preferred = normalizeLanguage(user?.languagePreference);
    if (user?.languagePreference && preferred !== language) {
      setLanguageState(preferred);
    }
  }, [user?.languagePreference, language]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback(
    (next: Language) => {
      setLanguageState(next);
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      } catch {
        // Storage can be blocked in private contexts.
      }

      if (user) {
        void apiFetchWithRefresh("/api/v1/auth/me/language", {
          method: "PATCH",
          service: "auth",
          body: JSON.stringify({ language: next }),
        })
          .then(() => refreshUser())
          .catch(() => {});
      }
    },
    [refreshUser, user],
  );

  const t = useCallback((text: string) => translateUiText(text, language), [language]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export { languageLabels, languageNames, languages };
