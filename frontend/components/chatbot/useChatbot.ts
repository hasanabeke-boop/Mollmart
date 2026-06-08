"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useWorkspaceOptional } from "@/context/WorkspaceContext";
import type { ChatbotHistoryItem, ChatbotReply, ChatMessage } from "./types";

/** Aligned with backend MOLLMART_FAQ — chips map to FAQ keyword matching */
const guestStarterPrompts = [
  "How do I create and publish a buyer request?",
  "How do sellers find buyer requests?",
  "How do chat and demo payment work?",
  "How do I register and log in?",
] as const;

const promptsByRole = {
  buyer: [
    "How do I accept a seller offer?",
    "Why does my request have no offers?",
    "How do chat and demo payment work?",
    "What happens after I accept an offer?",
  ],
  seller: [
    "How do sellers find buyer requests?",
    "How do I send a strong seller offer?",
    "Why can a seller send only one offer per request?",
    "How do reverse auctions work on Mollmart?",
  ],
  admin: [
    "What can admins do in Mollmart?",
    "How does moderation work?",
    "Where are request-deal orders?",
    "What do notifications cover?",
  ],
} as const;

type AssistantRole = keyof typeof promptsByRole | "guest";

function toHistoryItem(item: ChatMessage): ChatbotHistoryItem {
  return {
    role: item.role,
    content: item.content,
    ...(item.intent ? { intent: item.intent } : {}),
    ...(item.suggestedRoute ? { suggestedRoute: item.suggestedRoute } : {}),
  };
}

function resolveAssistantRole(
  userRole: string | undefined,
  workspaceRole: string | undefined,
): AssistantRole {
  const role = workspaceRole ?? userRole;
  if (role === "buyer" || role === "seller" || role === "admin") return role;
  return "guest";
}

function welcomeKeyForRole(role: AssistantRole): string {
  if (role === "buyer") return "Assistant welcome buyer";
  if (role === "seller") return "Assistant welcome seller";
  if (role === "admin") return "Assistant welcome admin";
  return "Assistant welcome guest";
}

function createWelcomeMessage(t: (text: string) => string, role: AssistantRole): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: t(welcomeKeyForRole(role)),
    createdAt: new Date().toISOString(),
    intent: "greeting",
  };
}

export function useChatbot() {
  const { user } = useAuth();
  const workspace = useWorkspaceOptional();
  const { language, t } = useLanguage();
  const pathname = usePathname();

  const assistantRole = resolveAssistantRole(user?.role, workspace?.activeRole);

  const starterPrompts = useMemo(() => {
    const prompts =
      assistantRole === "guest" ? [...guestStarterPrompts] : [...promptsByRole[assistantRole]];
    return prompts.map((prompt) => t(prompt));
  }, [assistantRole, t]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [createWelcomeMessage(t, "guest")]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(starterPrompts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMessages((current) => {
      if (current.length === 1 && current[0]?.id === "welcome") {
        return [createWelcomeMessage(t, assistantRole)];
      }
      return current;
    });
    setSuggestions(starterPrompts);
  }, [assistantRole, starterPrompts, t]);

  const reset = useCallback(() => {
    setMessages([createWelcomeMessage(t, assistantRole)]);
    setInput("");
    setSuggestions(starterPrompts);
    setError("");
    setLoading(false);
  }, [assistantRole, starterPrompts, t]);

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
            userRole: assistantRole === "guest" ? user?.role : assistantRole,
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
    [assistantRole, language, loading, messages, pathname, starterPrompts, t, user?.role],
  );

  return {
    user,
    assistantRole,
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
