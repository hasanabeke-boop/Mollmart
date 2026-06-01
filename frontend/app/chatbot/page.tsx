'use client';

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

type ChatbotReply = {
  reply: string;
  intent: string;
  suggestions: string[];
  suggestedRoute?: string;
  actions?: string[];
  confidence?: number;
  source?: "openai" | "local";
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  suggestedRoute?: string;
  actions?: string[];
  source?: "openai" | "local";
  intent?: string;
  confidence?: number;
};

type ChatbotHistoryItem = {
  role: Message["role"];
  content: string;
  intent?: string;
  suggestedRoute?: string;
};

const baseStarterPrompts = [
  "How do I create a request?",
  "How do sellers send offers?",
  "How does chat work?",
  "What do we need to deploy?",
];

const promptsByRole = {
  buyer: ["How do I publish my request?", "How do I accept an offer?", "Why do I have no chat?"],
  seller: ["How do I find buyer requests?", "How do I send a strong offer?", "Where are my seller metrics?"],
  admin: ["How do I manage users?", "How does moderation work?", "How do I manage categories?"],
} as const;

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toHistoryItem(item: Message): ChatbotHistoryItem {
  return {
    role: item.role,
    content: item.content,
    ...(item.intent ? { intent: item.intent } : {}),
    ...(item.suggestedRoute ? { suggestedRoute: item.suggestedRoute } : {}),
  };
}

export default function ChatbotPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const pathname = usePathname();
  const starterPrompts = user?.role ? [...promptsByRole[user.role], "What do we need to deploy?"] : baseStarterPrompts;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Ask about requests, offers, chat, profiles, notifications, admin tools, or deployment. I will keep the thread context as we go.",
      createdAt: new Date().toISOString(),
      intent: "greeting",
    },
  ]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState(starterPrompts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, loading]);

  const sendMessage = async (text: string) => {
    const message = text.trim();
    if (!message || loading) return;

    const now = new Date().toISOString();
    const nextMessages: Message[] = [
      ...messages,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
        createdAt: now,
      },
    ];

    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch<ChatbotReply>("/api/v1/chatbot/message", {
        method: "POST",
        body: JSON.stringify({
          message,
          history: nextMessages.slice(-12).map((item) => ({
            ...toHistoryItem(item),
          })),
          currentPath: pathname,
          userRole: user?.role,
          language,
        }),
      });

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.reply,
          createdAt: new Date().toISOString(),
          suggestedRoute: response.suggestedRoute,
          actions: response.actions,
          source: response.source,
          intent: response.intent,
          confidence: response.confidence,
        },
      ]);
      setSuggestions(response.suggestions.length > 0 ? response.suggestions : starterPrompts);
    } catch (err) {
      setError((err as Error).message || "Assistant is unavailable.");
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: "I could not reach the chatbot API. Please check that the backend is running.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <div className="app-page-min-height bg-[#f5f6f8]">
      <main className="min-w-0">
        <header className="border-b border-[var(--border)] bg-[var(--surface)] px-3 py-3 sm:px-4 sm:py-4 md:px-6">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-[#d9eadf] bg-[#f6fbf8] text-sm font-black tracking-tight text-[#0d1b12]">
              M
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-[#0d1b12]">Mollmart Assistant</h1>
              <p className="truncate text-sm text-[#4c9a66]">
                Context-aware help for {user?.role ? `${user.role} ` : ""}workflows and deployment
              </p>
            </div>
          </div>
        </header>

        <div className="px-3 py-4 sm:px-4 sm:py-6 md:px-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-4">
            {messages.map((message) => {
              const mine = message.role === "user";
              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        mine
                          ? "rounded-br-sm bg-primary text-green-950"
                          : "rounded-bl-sm border border-[#e7f3eb] bg-white text-[#0d1b12]"
                      }`}
                    >
                      {message.content}
                      {!mine && message.actions && message.actions.length > 0 && (
                        <ul className="mt-3 space-y-1 border-t border-[#e7f3eb] pt-3">
                          {message.actions.map((action) => (
                            <li key={action} className="flex items-start gap-2 text-xs text-[#4c9a66]">
                              <span className="material-symbols-outlined mt-0.5 text-[14px] text-primary">check_circle</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {!mine && message.suggestedRoute && (
                        <Link
                          href={message.suggestedRoute}
                          className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white"
                        >
                          Open this page
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </Link>
                      )}
                    </div>
                    <span className="text-[11px] text-[#4c9a66]">{timeLabel(message.createdAt)}</span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-[#e7f3eb] bg-white px-4 py-3 text-sm text-[#4c9a66] shadow-sm">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={endRef} aria-hidden />
          </div>
        </div>

        <section className="border-t border-[var(--border)] bg-[var(--surface)] px-3 py-3 sm:px-4 sm:py-4 md:px-6">
          <div className="mx-auto max-w-5xl">
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={loading}
                  onClick={() => void sendMessage(suggestion)}
                  className="shrink-0 rounded-full border border-[#e7f3eb] px-3 py-1.5 text-xs font-semibold text-[#0d1b12] hover:bg-[#f5f6f8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <form className="flex items-center gap-3" onSubmit={submit}>
              <div className="flex h-12 min-w-0 flex-1 items-center rounded-2xl bg-[#f5f6f8] px-4 focus-within:ring-2 focus-within:ring-primary/40">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask Mollmart Assistant..."
                  maxLength={2000}
                  className="h-full min-w-0 flex-1 border-none bg-transparent text-[#0d1b12] outline-none placeholder:text-[#4c9a66]"
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20 transition disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
