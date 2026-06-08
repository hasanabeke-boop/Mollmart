"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import AssistantChat from "./AssistantChat";
import AiMark from "./AiMark";

function isHiddenPath(pathname: string) {
  return (
    pathname === "/chatbot" ||
    pathname.startsWith("/chatbot/") ||
    pathname === "/chat" ||
    pathname.startsWith("/chat/")
  );
}

export default function AssistantWidget() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (isHiddenPath(pathname)) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-end p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:p-5 sm:pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {open && (
          <div
            className="flex h-[min(520px,calc(100dvh-var(--app-header-height)-12.5rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] md:h-[min(520px,calc(100dvh-var(--app-header-height)-5.5rem))]"
            role="dialog"
          aria-label={t("Mollmart Assistant")}
          >
            <AssistantChat variant="panel" onClose={() => setOpen(false)} />
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={`flex size-12 items-center justify-center rounded-full border transition ${
            open
              ? "border-[var(--border)] bg-[var(--foreground)] text-[var(--background)]"
              : "border-transparent bg-primary text-white hover:opacity-90"
          }`}
          aria-label={open ? t("Close assistant") : t("Assistant")}
          aria-expanded={open}
        >
          {open ? (
            <span className="material-symbols-outlined text-[26px]">close</span>
          ) : (
            <AiMark size="sm" variant="plain" className="text-[15px] text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
