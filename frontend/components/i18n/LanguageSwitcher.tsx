'use client';

import { languageLabels, languageNames, languages, useLanguage } from "@/context/LanguageContext";
import type { Language } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <label className="relative inline-flex h-9 items-center rounded-full border border-gray-200 bg-white px-2 text-xs font-bold text-[#0d1b12] shadow-sm transition-colors hover:bg-gray-50">
      <span className="sr-only">Language</span>
      <span className="material-symbols-outlined mr-1 text-[17px] text-gray-500" aria-hidden>
        language
      </span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
        className="cursor-pointer appearance-none border-0 bg-transparent pr-4 text-xs font-bold uppercase outline-none"
        aria-label="Language"
        title={languageNames[language]}
      >
        {languages.map((item) => (
          <option key={item} value={item}>
            {languageLabels[item]}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-1.5 text-[10px] text-gray-400">▾</span>
    </label>
  );
}
