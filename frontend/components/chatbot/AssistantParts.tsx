"use client";

import { FormEvent, useEffect, useRef } from "react";
import Link from "next/link";
import type { ChatMessage } from "./types";

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-[#4c9a66]/70 animate-bounce"
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
    <div className={`flex flex-col ${compact ? "gap-3" : "gap-4"}`}>
      {messages.map((message) => {
        const mine = message.role === "user";
        return (
          <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1`}>
              <div
                className={`rounded-2xl text-sm leading-relaxed ${
                  compact ? "px-3 py-2" : "px-4 py-3 shadow-sm"
                } ${
                  mine
                    ? "rounded-br-md bg-primary text-white"
                    : "rounded-bl-md border border-[#e7f3eb] bg-white text-[#0d1b12]"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {!mine && message.actions && message.actions.length > 0 && (
                  <ul className="mt-2.5 space-y-1 border-t border-[#e7f3eb] pt-2.5">
                    {message.actions.map((action) => (
                      <li key={action} className="flex items-start gap-2 text-xs text-[#4c9a66]">
                        <span className="material-symbols-outlined mt-0.5 text-[13px] text-primary">check_circle</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {!mine && message.suggestedRoute && (
                  <Link
                    href={message.suggestedRoute}
                    className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/15"
                  >
                    {t("Open this page")}
                    <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </Link>
                )}
              </div>
              <span className="px-1 text-[10px] text-[#4c9a66]/80">{timeLabel(message.createdAt)}</span>
            </div>
          </div>
        );
      })}

      {loading && (
        <div className="flex justify-start">
          <div className="rounded-2xl rounded-bl-md border border-[#e7f3eb] bg-white px-3 py-2 shadow-sm">
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
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {suggestions.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={loading}
              onClick={() => void onSend(suggestion)}
              className="shrink-0 rounded-full border border-[#e7f3eb] bg-white px-2.5 py-1 text-[11px] font-medium text-[#0d1b12] transition hover:border-primary/30 hover:bg-[#f5f6f8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      <form className="flex items-center gap-2" onSubmit={submit}>
        <div className="flex h-11 min-w-0 flex-1 items-center rounded-xl border border-[#e7f3eb] bg-[#f8faf9] px-3 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t("Ask Mollmart Assistant...")}
            maxLength={2000}
            className="h-full min-w-0 flex-1 border-none bg-transparent text-sm text-[#0d1b12] outline-none placeholder:text-[#4c9a66]/70"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-[#4b63e8] disabled:cursor-not-allowed disabled:opacity-45"
          aria-label={t("Send message")}
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      </form>
    </div>
  );
}
