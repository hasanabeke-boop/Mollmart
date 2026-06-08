"use client";

import Link from "next/link";
import { MessageList, Composer } from "./AssistantParts";
import { useChatbot } from "./useChatbot";
import AiMark from "./AiMark";

type AssistantChatProps = {
  variant?: "page" | "panel";
  onClose?: () => void;
};

function roleSubtitle(role: string | undefined, t: (text: string) => string) {
  if (role === "buyer") return t("Context-aware help for buyer workflows and deployment");
  if (role === "seller") return t("Context-aware help for seller workflows and deployment");
  if (role === "admin") return t("Context-aware help for admin workflows and deployment");
  return t("Context-aware help for workflows and deployment");
}

export default function AssistantChat({ variant = "page", onClose }: AssistantChatProps) {
  const compact = variant === "panel";
  const { user, t, messages, input, setInput, suggestions, loading, error, sendMessage } = useChatbot();

  if (variant === "panel") {
    return (
      <div className="flex h-full min-h-0 flex-col bg-[#f5f6f8]">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e7f3eb] bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <AiMark size="md" />
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-[#0d1b12]">{t("Mollmart Assistant")}</h2>
              <p className="truncate text-[11px] text-[#4c9a66]">{t("Need help? Ask anything.")}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/chatbot"
              className="flex size-8 items-center justify-center rounded-lg text-[#4c9a66] transition hover:bg-[#f5f6f8] hover:text-[#0d1b12]"
              aria-label={t("Open full page")}
              title={t("Open full page")}
            >
              <span className="material-symbols-outlined text-[18px]">open_in_full</span>
            </Link>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-lg text-[#4c9a66] transition hover:bg-[#f5f6f8] hover:text-[#0d1b12]"
                aria-label={t("Close assistant")}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <MessageList messages={messages} loading={loading} t={t} compact />
        </div>

        <footer className="shrink-0 border-t border-[#e7f3eb] bg-white px-4 py-3">
          <Composer
            input={input}
            setInput={setInput}
            suggestions={suggestions}
            loading={loading}
            error={error}
            onSend={sendMessage}
            t={t}
            compact
          />
        </footer>
      </div>
    );
  }

  return (
    <div className="app-page-min-height flex flex-col bg-[#f5f6f8]">
      <header className="shrink-0 border-b border-[#e7f3eb] bg-white px-4 py-5 lg:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <AiMark size="lg" />
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[#0d1b12]">{t("Mollmart Assistant")}</h1>
            <p className="truncate text-sm text-[#4c9a66]">{roleSubtitle(user?.role, t)}</p>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <MessageList messages={messages} loading={loading} t={t} />
        </div>
      </div>

      <section className="shrink-0 border-t border-[#e7f3eb] bg-white px-4 py-4 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Composer
            input={input}
            setInput={setInput}
            suggestions={suggestions}
            loading={loading}
            error={error}
            onSend={sendMessage}
            t={t}
          />
        </div>
      </section>
    </div>
  );
}
