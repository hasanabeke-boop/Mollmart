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
  if (role === "buyer") return t("Help with requests, offers, chat, and orders");
  if (role === "seller") return t("Help with buyer requests, offers, showcase, and auctions");
  if (role === "admin") return t("Help with users, moderation, categories, and orders");
  return t("Help with Mollmart buyer and seller workflows");
}

export default function AssistantChat({ variant = "page", onClose }: AssistantChatProps) {
  const compact = variant === "panel";
  const { user, assistantRole, t, messages, input, setInput, suggestions, loading, error, sendMessage, reset } =
    useChatbot();

  if (variant === "panel") {
    return (
      <div className="flex h-full min-h-0 flex-col bg-[var(--background)]">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <AiMark size="md" />
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-[var(--foreground)]">{t("Mollmart Assistant")}</h2>
              <p className="truncate text-xs text-[var(--text-muted)]">
                {roleSubtitle(assistantRole === "guest" ? user?.role : assistantRole, t)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={reset}
              disabled={loading}
              className="flex size-10 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:opacity-40"
              aria-label={t("New conversation")}
              title={t("New conversation")}
            >
              <span className="material-symbols-outlined text-[18px]">edit_square</span>
            </button>
            <Link
              href="/chatbot"
              className="flex size-10 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
              aria-label={t("Open full page")}
              title={t("Open full page")}
            >
              <span className="material-symbols-outlined text-[18px]">open_in_full</span>
            </Link>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex size-10 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
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

        <footer className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3">
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
    <div className="app-page-min-height flex min-h-0 flex-col bg-[var(--background)]">
      <header className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-5 lg:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <AiMark size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-[var(--foreground)]">{t("Mollmart Assistant")}</h1>
            <p className="truncate text-sm text-[var(--text-muted)]">
              {roleSubtitle(assistantRole === "guest" ? user?.role : assistantRole, t)}
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            disabled={loading}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:opacity-40"
            title={t("New conversation")}
          >
            <span className="material-symbols-outlined text-[16px]">edit_square</span>
            <span className="hidden sm:inline">{t("New conversation")}</span>
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <MessageList messages={messages} loading={loading} t={t} />
        </div>
      </div>

      <section className="shrink-0 border-b border-t border-[var(--border)] bg-[var(--surface)] px-4 py-4 lg:px-8">
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
