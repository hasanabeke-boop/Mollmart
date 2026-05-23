"use client";

import { useLanguage } from "@/context/LanguageContext";
import type { AppLanguage } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { language, setLanguage, languages, t } = useLanguage();

  return (
    <label className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-[#0d1b12]">
      <span className="sr-only">{t("Language")}</span>
      <span className="material-symbols-outlined text-[18px]" aria-hidden>
        language
      </span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as AppLanguage)}
        className="bg-transparent text-xs font-bold outline-none"
        aria-label={t("Language")}
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.nativeLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
