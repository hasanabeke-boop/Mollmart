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
  translateUiTemplate,
  type Language,
} from "@/lib/i18n";

const LANGUAGE_STORAGE_KEY = "mollmart_language";

type LanguageState = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (text: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageState | null>(null);

function readStoredLanguage(): Language | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) return normalizeLanguage(stored);
  } catch {
    // Storage can be blocked in private contexts.
  }

  return null;
}

function getInitialLanguage(): Language {
  return readStoredLanguage() ?? normalizeLanguage(typeof window !== "undefined" ? window.navigator.language : defaultLanguage);
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

  useEffect(() => {
    if (!currentUserId || !user) return;

    const stored = readStoredLanguage();
    setSelection((prev) => {
      if (prev.userId === currentUserId) return prev;
      const next = stored ?? serverLanguage ?? prev.language;
      return { language: next, userId: currentUserId };
    });

    if (stored && stored !== serverLanguage) {
      void apiFetchWithRefresh("/api/v1/auth/me/language", {
        method: "PATCH",
        service: "auth",
        body: JSON.stringify({ language: stored }),
      })
        .then(() => refreshUser())
        .catch(() => {});
    }
  }, [currentUserId, refreshUser, serverLanguage, user]);

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

  const t = useCallback(
    (text: string, vars?: Record<string, string | number>) => translateUiTemplate(text, language, vars),
    [language],
  );
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export { languageLabels, languageNames, languages };
