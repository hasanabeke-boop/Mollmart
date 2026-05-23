"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetchWithRefresh } from "@/lib/api";
import {
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  normalizeLanguage,
  translateText,
  type AppLanguage,
} from "@/lib/i18n";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (text: string) => string;
  languages: typeof SUPPORTED_LANGUAGES;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const originalText = new WeakMap<Text, string>();
const originalAttr = new WeakMap<Element, Map<string, string>>();
const translatedAttrs = ["placeholder", "title", "aria-label"];

function shouldSkip(node: Node): boolean {
  const parent = node.parentElement;
  if (!parent) return true;
  if (parent.closest("script,style,noscript,textarea,select,[data-no-translate],.material-symbols-outlined")) {
    return true;
  }
  return false;
}

function translateTree(root: ParentNode, language: AppLanguage) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  while (walker.nextNode()) texts.push(walker.currentNode as Text);

  for (const node of texts) {
    if (shouldSkip(node)) continue;
    const raw = originalText.get(node) ?? node.nodeValue ?? "";
    if (!originalText.has(node)) originalText.set(node, raw);
    const leading = raw.match(/^\s*/)?.[0] ?? "";
    const trailing = raw.match(/\s*$/)?.[0] ?? "";
    const core = raw.trim();
    if (!core) continue;
    const next = `${leading}${translateText(core, language)}${trailing}`;
    if (node.nodeValue !== next) node.nodeValue = next;
  }

  const elements = root instanceof Element ? [root, ...Array.from(root.querySelectorAll("*"))] : Array.from(root.querySelectorAll("*"));
  for (const el of elements) {
    if (el.closest("[data-no-translate],.material-symbols-outlined")) continue;
    for (const attr of translatedAttrs) {
      const value = el.getAttribute(attr);
      if (!value) continue;
      let attrMap = originalAttr.get(el);
      if (!attrMap) {
        attrMap = new Map();
        originalAttr.set(el, attrMap);
      }
      if (!attrMap.has(attr)) attrMap.set(attr, value);
      const raw = attrMap.get(attr) ?? value;
      const next = translateText(raw, language);
      if (el.getAttribute(attr) !== next) el.setAttribute(attr, next);
    }
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth();
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window === "undefined") return "en";
    return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  });
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    const preferred = normalizeLanguage(user?.languagePreference);
    if (user?.languagePreference && preferred !== language) {
      setTimeout(() => setLanguageState(preferred), 0);
    }
  }, [user?.languagePreference, language]);

  useEffect(() => {
    document.documentElement.lang = language;
    translateTree(document.body, language);
    observerRef.current?.disconnect();
    observerRef.current = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
            translateTree(node.parentElement, language);
          } else if (node instanceof Element) {
            translateTree(node, language);
          }
        }
        if (mutation.type === "characterData" && mutation.target.parentElement) {
          translateTree(mutation.target.parentElement, language);
        }
      }
    });
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observerRef.current?.disconnect();
  }, [language]);

  const setLanguage = useCallback(
    (next: AppLanguage) => {
      setLanguageState(next);
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      if (user) {
        void apiFetchWithRefresh("/api/v1/auth/me/language", {
          method: "PATCH",
          service: "auth",
          body: JSON.stringify({ language: next }),
        }).then(() => refreshUser()).catch(() => {});
      }
    },
    [user, refreshUser],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (text: string) => translateText(text, language),
      languages: SUPPORTED_LANGUAGES,
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
