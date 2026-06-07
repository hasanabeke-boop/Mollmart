"use client";

import { useEffect, useState } from "react";
import { useLandingCopy } from "@/hooks/useLandingCopy";

interface ProgressNavProps {
  sections: readonly string[];
}

export default function ProgressNav({ sections }: ProgressNavProps) {
  const copy = useLandingCopy();
  const [activeIndex, setActiveIndex] = useState(0);

  const sectionLabel = (id: string) => {
    const key = id.replace("#", "") as keyof typeof copy.nav.progress;
    return copy.nav.progress[key] ?? id.replace("#", "");
  };

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach((id, index) => {
      const el = document.querySelector(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveIndex(index);
          });
        },
        { threshold: 0.3 },
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
      {sections.map((id, index) => (
        <button
          key={id}
          type="button"
          onClick={() => scrollTo(id)}
          aria-label={sectionLabel(id)}
          className={`group relative flex items-center justify-end transition-all duration-300 ${
            activeIndex === index ? "opacity-100" : "opacity-40 hover:opacity-70"
          }`}
        >
          <span className="absolute right-6 whitespace-nowrap text-xs font-medium text-mm-text opacity-0 transition-opacity group-hover:opacity-100 dark:text-white">
            {sectionLabel(id)}
          </span>
          <span
            className={`block rounded-full transition-all duration-300 ${
              activeIndex === index
                ? "h-3 w-3 bg-mm-primary"
                : "h-2 w-2 bg-mm-text-secondary dark:bg-gray-500"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
