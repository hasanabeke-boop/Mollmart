"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import type { ChatbotHistoryItem, ChatbotReply, ChatMessage } from "./types";

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

function toHistoryItem(item: ChatMessage): ChatbotHistoryItem {
  return {
    role: item.role,
    content: item.content,
    ...(item.intent ? { intent: item.intent } : {}),
    ...(item.suggestedRoute ? { suggestedRoute: item.suggestedRoute } : {}),
  };
}

function createWelcomeMessage(t: (text: string) => string): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: t(
      "Ask about requests, offers, chat, profiles, notifications, admin tools, or deployment. I will keep the thread context as we go.",
    ),
    createdAt: new Date().toISOString(),
    intent: "greeting",
  };
}

export function useChatbot() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const pathname = usePathname();

  const starterPrompts = useMemo(
    () =>
      user?.role
        ? [...promptsByRole[user.role], "What do we need to deploy?"].map((prompt) => t(prompt))
        : baseStarterPrompts.map((prompt) => t(prompt)),
    [t, user?.role],
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() => [createWelcomeMessage(t)]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(starterPrompts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = useCallback(() => {
    setMessages([createWelcomeMessage(t)]);
    setInput("");
    setSuggestions(starterPrompts);
    setError("");
    setLoading(false);
  }, [starterPrompts, t]);

  const sendMessage = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || loading) return;

      const now = new Date().toISOString();
      const nextMessages: ChatMessage[] = [
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
            history: nextMessages.slice(-12).map((item) => toHistoryItem(item)),
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
        setError((err as Error).message || t("Assistant is unavailable."));
        setMessages((current) => [
          ...current,
          {
            id: `assistant-error-${Date.now()}`,
            role: "assistant",
            content: t("I could not reach the chatbot API. Please check that the backend is running."),
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [language, loading, messages, pathname, starterPrompts, t, user?.role],
  );

  return {
    user,
    t,
    messages,
    input,
    setInput,
    suggestions,
    loading,
    error,
    sendMessage,
    reset,
  };
}
