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
  const currentUserId = user?.id ?? null;
  const serverLanguage = user?.languagePreference ? normalizeLanguage(user.languagePreference) : null;
  const [selection, setSelection] = useState<{ language: Language; userId: string | null }>(() => ({
    language: getInitialLanguage(),
    userId: null,
  }));
  const language = selection.userId === currentUserId ? selection.language : serverLanguage ?? selection.language;

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback(
    (next: Language) => {
      setSelection({ language: next, userId: currentUserId });
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
    [currentUserId, refreshUser, user],
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
