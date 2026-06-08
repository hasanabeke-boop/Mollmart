"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import AssistantChat from "./AssistantChat";
import AiMark from "./AiMark";

function isHiddenPath(pathname: string) {
  return pathname === "/chatbot" || pathname.startsWith("/chatbot/");
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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-end p-4 sm:p-5">
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {open && (
          <div
            className="flex h-[min(520px,calc(100dvh-7rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#e7f3eb] bg-white shadow-xl shadow-black/10"
            role="dialog"
          aria-label={t("Mollmart Assistant")}
          >
            <AssistantChat variant="panel" onClose={() => setOpen(false)} />
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={`flex size-14 items-center justify-center rounded-full shadow-lg transition ${
            open
              ? "bg-[#0d1b12] text-white hover:bg-[#1a2e22]"
              : "bg-primary text-white hover:bg-[#4b63e8] shadow-primary/25"
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
