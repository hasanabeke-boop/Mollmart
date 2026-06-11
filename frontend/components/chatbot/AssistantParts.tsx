"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ChatMessage } from "./types";

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CopyButton({ text, t }: { text: string; t: (s: string) => string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
      title={copied ? t("Copied!") : t("Copy")}
    >
      <span className="material-symbols-outlined text-[13px]">{copied ? "check" : "content_copy"}</span>
      <span>{copied ? t("Copied!") : t("Copy")}</span>
    </button>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-0.5" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1 rounded-full bg-[var(--text-muted)] animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }}
        />
      ))}
    </div>
  );
}

type MessageListProps = {
  messages: ChatMessage[];
  loading: boolean;
  t: (text: string) => string;
  compact?: boolean;
};

export function MessageList({ messages, loading, t, compact }: MessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages.length, loading]);

  return (
    <div className={`flex flex-col ${compact ? "gap-2.5" : "gap-3"}`}>
      {messages.map((message) => {
        const mine = message.role === "user";
        return (
          <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1`}>
              <div
                className={`rounded-lg text-sm leading-relaxed ${
                  compact ? "px-3 py-2" : "px-3.5 py-2.5"
                } ${
                  mine
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {!mine && message.actions && message.actions.length > 0 && (
                  <ol className="mt-2.5 space-y-1.5 border-t border-[var(--border-muted)] pt-2.5">
                    {message.actions.map((action, index) => (
                      <li key={action} className="flex gap-2 text-xs text-[var(--text-muted)]">
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                          {index + 1}
                        </span>
                        <span className="min-w-0 pt-0.5">{action}</span>
                      </li>
                    ))}
                  </ol>
                )}
                {!mine && message.suggestedRoute && (
                  <Link
                    href={message.suggestedRoute}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    {t("Open this page")}
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-1 px-0.5">
                <span className="text-[10px] text-[var(--text-muted)]">{timeLabel(message.createdAt)}</span>
                {!mine && <CopyButton text={message.content} t={t} />}
              </div>
            </div>
          </div>
        );
      })}

      {loading && (
        <div className="flex justify-start">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
            <TypingIndicator />
          </div>
        </div>
      )}
      <div ref={endRef} aria-hidden />
    </div>
  );
}

type ComposerProps = {
  input: string;
  setInput: (value: string) => void;
  suggestions: string[];
  loading: boolean;
  error: string;
  onSend: (text: string) => void;
  t: (text: string) => string;
  compact?: boolean;
};

export function Composer({ input, setInput, suggestions, loading, error, onSend, t, compact }: ComposerProps) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSend(input);
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-2.5"}>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={loading}
              onClick={() => void onSend(suggestion)}
              className="min-h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      <form className="flex items-center gap-2" onSubmit={submit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t("Ask Mollmart Assistant...")}
          maxLength={2000}
          className="h-12 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-base text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)] focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex h-12 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-base font-medium text-white transition hover:opacity-90 disabled:opacity-40 sm:px-5"
          aria-label={t("Send message")}
        >
          <span className="material-symbols-outlined text-[22px] sm:hidden">send</span>
          <span className="hidden sm:inline">{t("Send message")}</span>
        </button>
      </form>
    </div>
  );
}
