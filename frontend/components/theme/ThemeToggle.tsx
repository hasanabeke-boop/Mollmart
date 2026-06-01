'use client';

import { useThemeOptional } from "@/context/ThemeContext";

export default function ThemeToggle() {
  const themeCtx = useThemeOptional();
  if (themeCtx == null) return null;

  const { theme, toggleTheme } = themeCtx;
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex size-9 items-center justify-center rounded-full text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)]"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span className="material-symbols-outlined text-[20px]">
        {isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
