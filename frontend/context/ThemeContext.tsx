'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "mollmart_theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    // ignore
  }
  return null;
}

function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = readStoredTheme();
  if (stored) return stored;
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from storage/system preference on client mount
  useEffect(() => {
    const stored = readStoredTheme();
    const prefersDark =
      stored == null && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial: Theme = stored ?? (prefersDark ? "dark" : "light");
    setThemeState(initial);
    applyThemeClass(initial);
    setMounted(true);
  }, []);

  // Apply theme class and save to localStorage whenever theme changes
  useEffect(() => {
    if (mounted) {
      applyThemeClass(theme);
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // ignore
      }
    }
  }, [theme, mounted]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx == null) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

export function useThemeOptional() {
  return useContext(ThemeContext);
}
