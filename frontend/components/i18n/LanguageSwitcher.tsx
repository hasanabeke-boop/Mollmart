'use client';

import { useEffect, useRef, useState } from "react";
import { languageLabels, languageNames, languages, useLanguage } from "@/context/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div className="relative" ref={ref} data-no-translate>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 min-w-[4.75rem] items-center justify-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-black text-[var(--foreground)] shadow-sm transition hover:border-primary/40 hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-primary/30"
        aria-label="Language"
        title={languageNames[language]}
      >
        <span className="material-symbols-outlined text-[19px] text-[var(--text-muted)]" aria-hidden>
          language
        </span>
        <span>{languageLabels[language]}</span>
        <span
          className={`material-symbols-outlined text-[16px] text-[var(--text-muted)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          expand_more
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-[80] w-36 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-xl">
          {languages.map((item) => {
            const active = item === language;
            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setLanguage(item);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                  active
                    ? "bg-primary/10 font-bold text-[var(--foreground)]"
                    : "font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                <span>{languageNames[item]}</span>
                <span className="text-xs font-black text-[var(--text-muted)]">{languageLabels[item]}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
