'use client';

import { useEffect, useState } from 'react';
import { useThemeOptional } from "@/context/ThemeContext";
// Импортируем аккуратное Солнце и Луну из Lucide
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const themeCtx = useThemeOptional();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || themeCtx == null) return null;

  const { theme, toggleTheme } = themeCtx;
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex size-9 items-center justify-center rounded-full text-mm-text transition-colors hover:bg-[var(--surface-hover)] dark:text-white"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {/* 
        Размер size={20} идеально совпадает с твоим прошлым стилем text-[20px].
        Класс animate-spin-slow или просто transition-transform можно добавить по желанию.
      */}
      {isDark ? (
        <Sun size={20} className="stroke-[2px] text-yellow-500" />
      ) : (
        <Moon size={20} className="stroke-[2px]" />
      )}
    </button>
  );
}
