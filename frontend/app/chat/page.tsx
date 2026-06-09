'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetchWithRefresh } from "@/lib/api";
import {
  acceptPriceProposal,
  placeRequestOrderConversation,
  fetchDealState,
  postApplyOfferTotal,
  postPriceProposal,
  type DealState,
} from "@/lib/requestDeals";
import { computeOfferLineTotal, normalizeRequestQuantity } from "@/lib/offerPricing";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { SearchField, searchInputClassName } from "@/components/ui/SearchField";
import { fieldInputClassName } from "@/components/ui/fieldStyles";
import ShippingFields from "@/components/shipping/ShippingFields";
import { EMPTY_SHIPPING, validateShipping } from "@/lib/shipping";
import { DEFAULT_CURRENCY, formatMoney, normalizeCurrency } from "@/lib/currency";

const panelInputClass = fieldInputClassName;

type ApiMessage = {
  id: string;
  senderId: string;
  senderRole: "buyer" | "seller" | "admin";
  body: string;
  messageType: "text" | "system";
  createdAt: string;
  readStates?: Array<{ userId: string; readAt: string }>;
};

type ApiConversation = {
  id: string;
  buyerId: string;
  sellerId: string;
  status: "active" | "closed";
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string | null;
  messages?: ApiMessage[];
  lastMessage?: ApiMessage | null;
  unreadCount?: number;
  otherParticipant?: {
    id: string;
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
    role: "buyer" | "seller";
    city?: string | null;
    ratingAverage?: string;
    completedDealsCount?: number;
    businessType?: string | null;
  };
  request?: {
    id: string;
    title: string;
    status: string;
    budgetMin?: string | number | null;
    budgetMax?: string | number | null;
    currency: string;
    location?: string | null;
    quantity?: number;
  };
  offer?: {
    id: string;
    price: string | number;
    currency: string;
    status: string;
  } | null;
};

type ChatMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  pending?: boolean;
  failed?: boolean;
};

type Conversation = {
  id: string;
  buyerId: string;
  sellerId: string;
  status: "active" | "closed";
  name: string;
  avatarUrl?: string | null;
  role: "buyer" | "seller";
  lastMessage: string;
  lastMessageAt?: string | null;
  unreadCount: number;
  request: {
    id?: string;
    title: string;
    status?: string;
    budgetMin?: string | number | null;
    budgetMax?: string | number | null;
    currency?: string;
    location?: string | null;
    quantity?: number;
  };
  offer?: {
    id: string;
    price: string | number;
    currency: string;
    status: string;
  } | null;
  details: {
    city?: string | null;
    ratingAverage?: string;
    completedDealsCount?: number;
    businessType?: string | null;
  };
  messages: ChatMessage[];
};

function listFrom<T>(data: { items?: T[]; data?: T[] } | T[]): T[] {
  if (Array.isArray(data)) return data;
  return data.items || data.data || [];
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "MM";
}

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatCurrency(value?: string | number | null, currency?: string | null) {
  if (value == null || value === "") return "";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  return formatMoney(amount, normalizeCurrency(currency));
}

function formatBudget(conversation: Conversation) {
  const { budgetMin, budgetMax, currency } = conversation.request;
  const cur = normalizeCurrency(currency);
  const min = formatCurrency(budgetMin, cur);
  const max = formatCurrency(budgetMax, cur);
  if (min && max) return `${min} - ${max}`;
  return min || max || "Open budget";
}

function mapConversation(item: ApiConversation, currentUserId?: string): Conversation {
  const last = item.lastMessage || item.messages?.[0] || null;
  const otherId = currentUserId === item.buyerId ? item.sellerId : item.buyerId;
  const fallbackName = otherId ? `User ${otherId.slice(0, 8)}` : "Conversation";

  return {
    id: item.id,
    buyerId: item.buyerId,
    sellerId: item.sellerId,
    status: item.status,
    name: item.otherParticipant?.name || fallbackName,
    avatarUrl: item.otherParticipant?.avatarUrl || null,
    role: item.otherParticipant?.role || (currentUserId === item.buyerId ? "seller" : "buyer"),
    lastMessage: last?.body || "No messages yet",
    lastMessageAt: last?.createdAt || item.lastMessageAt || item.updatedAt,
    unreadCount: item.unreadCount || 0,
    request: {
      id: item.request?.id,
      title: item.request?.title || "Request conversation",
      status: item.request?.status,
      budgetMin: item.request?.budgetMin,
      budgetMax: item.request?.budgetMax,
      currency: item.request?.currency,
      location: item.request?.location,
      quantity: item.request?.quantity,
    },
    offer: item.offer || null,
    details: {
      city: item.otherParticipant?.city,
      ratingAverage: item.otherParticipant?.ratingAverage,
      completedDealsCount: item.otherParticipant?.completedDealsCount,
      businessType: item.otherParticipant?.businessType,
    },
    messages: [],
  };
}

function Avatar({ name, src, size = "md" }: { name: string; src?: string | null; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "size-16 text-lg" : size === "sm" ? "size-8 text-xs" : "size-11 text-sm";
  if (src) {
    return (
      <div
        className={`${sizeClass} shrink-0 rounded-full bg-cover bg-center`}
        style={{ backgroundImage: `url("${src}")` }}
      />
    );
  }

  return (
    <div className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary`}>
      {initials(name)}
    </div>
  );
}

function ChatPageContent() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const preferredConversationId = searchParams.get("c");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [dealState, setDealState] = useState<DealState | null>(null);
  const [dealLoading, setDealLoading] = useState(false);
  const [proposeAmount, setProposeAmount] = useState("");
  const [dealBusy, setDealBusy] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [dealPanelOpen, setDealPanelOpen] = useState(false);
  const [shippingForm, setShippingForm] = useState(EMPTY_SHIPPING);

  const active = conversations.find((conversation) => conversation.id === activeId);
  const isBuyerOnThread = Boolean(user?.id && active && active.buyerId === user.id);
  const isSellerOnThread = Boolean(user?.id && active && active.sellerId === user.id);
  const canPlaceOrderAsBuyer = isBuyerOnThread && user?.canBuy !== false;
  const showOrderCta =
    Boolean(dealState?.agreedPrice != null && dealState?.agreedCurrency && !dealState?.orderId && canPlaceOrderAsBuyer);

  const loadConversations = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!user?.id) return;
    if (!silent) setLoading(true);
    try {
      const data = await apiFetchWithRefresh<{ items?: ApiConversation[]; data?: ApiConversation[] }>(
        "/api/v1/conversations?limit=50",
        { service: "chat" },
      );
      const mapped = listFrom(data).map((item) => mapConversation(item, user.id));
      setConversations((previous) => {
        const messagesById = new Map(previous.map((conversation) => [conversation.id, conversation.messages]));
        return mapped.map((conversation) => ({
          ...conversation,
          messages: messagesById.get(conversation.id) || [],
        }));
      });

      setActiveId((current) => {
        if (preferredConversationId && mapped.some((conversation) => conversation.id === preferredConversationId)) {
          return preferredConversationId;
        }
        if (current && mapped.some((conversation) => conversation.id === current)) {
          return current;
        }
        return mapped[0]?.id || "";
      });
      setError("");
    } catch (err) {
      setError((err as Error).message || "Failed to load conversations.");
      setConversations([]);
      setActiveId("");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [preferredConversationId, user?.id]);

  const loadMessages = useCallback(async (conversationId: string, { silent = false }: { silent?: boolean } = {}) => {
    try {
      const data = await apiFetchWithRefresh<{ items?: ApiMessage[]; data?: ApiMessage[] }>(
        `/api/v1/conversations/${conversationId}/messages?limit=100`,
        { service: "chat" },
      );
      const messages = listFrom(data)
        .slice()
        .reverse()
        .map((message) => ({
          id: message.id,
          senderId: message.senderId,
          body: message.body,
          createdAt: message.createdAt,
        }));

      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages,
                unreadCount: 0,
                lastMessage: messages[messages.length - 1]?.body || conversation.lastMessage,
                lastMessageAt: messages[messages.length - 1]?.createdAt || conversation.lastMessageAt,
              }
            : conversation,
        ),
      );
    } catch (err) {
      if (!silent) setError((err as Error).message || "Failed to load messages.");
    }
  }, []);

  const loadDealState = useCallback(async (conversationId: string) => {
    try {
      setDealLoading(true);
      const d = await fetchDealState(conversationId);
      setDealState(d);
    } catch {
      setDealState(null);
    } finally {
      setDealLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      void loadConversations();
    }
  }, [authLoading, loadConversations]);

  useEffect(() => {
    if (!activeId) return;
    void loadMessages(activeId);
    void loadDealState(activeId);
    apiFetchWithRefresh(`/api/v1/conversations/${activeId}/read`, {
      method: "POST",
      service: "chat",
    }).catch(() => {});
  }, [activeId, loadMessages, loadDealState]);

  useEffect(() => {
    if (!user?.id) return;
    const interval = window.setInterval(() => {
      void loadConversations({ silent: true });
      if (activeId) {
        void loadMessages(activeId, { silent: true });
        void loadDealState(activeId);
      }
    }, 8000);

    return () => window.clearInterval(interval);
  }, [activeId, loadConversations, loadDealState, loadMessages, user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [active?.messages.length]);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) =>
      [conversation.name, conversation.lastMessage, conversation.request.title]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [conversations, search]);

  const sendMessage = async () => {
    if (!active || !user?.id) return;
    const text = input.trim();
    if (!text || sending) return;

    const temporaryId = `pending-${Date.now()}`;
    const createdAt = new Date().toISOString();
    setInput("");
    setSending(true);
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === active.id
          ? {
              ...conversation,
              lastMessage: text,
              lastMessageAt: createdAt,
              messages: [
                ...conversation.messages,
                { id: temporaryId, senderId: user.id, body: text, createdAt, pending: true },
              ],
            }
          : conversation,
      ),
    );

    try {
      const saved = await apiFetchWithRefresh<ApiMessage>(`/api/v1/conversations/${active.id}/messages`, {
        method: "POST",
        service: "chat",
        body: JSON.stringify({ body: text, messageType: "text" }),
      });

      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.id === active.id
            ? {
                ...conversation,
                messages: conversation.messages.map((message) =>
                  message.id === temporaryId
                    ? {
                        id: saved.id,
                        senderId: saved.senderId,
                        body: saved.body,
                        createdAt: saved.createdAt,
                      }
                    : message,
                ),
              }
            : conversation,
        ),
      );
      setError("");
      void loadConversations({ silent: true });
    } catch (err) {
      setError((err as Error).message || "Message failed to send.");
      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.id === active.id
            ? {
                ...conversation,
                messages: conversation.messages.map((message) =>
                  message.id === temporaryId ? { ...message, pending: false, failed: true } : message,
                ),
              }
            : conversation,
        ),
      );
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="app-fill-below-header flex items-center justify-center bg-[var(--background)]">
        <p className="text-sm text-[var(--text-muted)]">{t("Loading chat...")}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="app-fill-below-header flex items-center justify-center bg-[var(--background)] px-4">
        <div className="app-card w-full max-w-sm rounded-lg p-6 text-center">
          <h1 className="text-lg font-semibold text-[var(--foreground)]">{t("Sign in required")}</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{t("Please log in to view your messages.")}</p>
        </div>
      </main>
    );
  }

  if (conversations.length === 0) {
    return (
      <main className="app-fill-below-header flex items-center justify-center bg-[var(--background)] px-4">
        <div className="app-card w-full max-w-md rounded-lg p-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined">forum</span>
          </div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">{t("No conversations yet")}</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{t("Chats will appear after an accepted offer.")}</p>
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <div className="app-fill-below-header -mx-3 flex overflow-hidden bg-[var(--background)] sm:-mx-4 md:mx-0">
      <aside
        className={`${
          mobileListOpen ? "fixed inset-0 z-50 flex w-full max-w-none" : "hidden lg:flex"
        } shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] lg:w-80 xl:w-96`}
      >
        <div className="border-b border-[var(--border)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--foreground)]">{t("Messages")}</h2>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] lg:hidden"
              onClick={() => setMobileListOpen(false)}
              aria-label="Close conversations"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder={t("Search conversations")}
            width="full"
            inputClassName={searchInputClassName}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => {
                setActiveId(conversation.id);
                setMobileListOpen(false);
              }}
              className={`flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors ${
                conversation.id === activeId
                  ? "border-primary bg-primary/8"
                  : "border-transparent hover:bg-[var(--surface-hover)]"
              }`}
            >
              <Avatar name={conversation.name} src={conversation.avatarUrl} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate font-medium text-[var(--foreground)]">{conversation.name}</p>
                  <span className="shrink-0 text-xs text-[var(--text-muted)]">{formatTime(conversation.lastMessageAt)}</span>
                </div>
                <p className="truncate text-sm text-[var(--text-muted)]">{conversation.lastMessage}</p>
              </div>
              {conversation.unreadCount > 0 && (
                <span className="flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
                  {conversation.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        {active && (
          <>
            <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 lg:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] lg:hidden"
                  onClick={() => setMobileListOpen(true)}
                  aria-label="Open conversations"
                >
                  <span className="material-symbols-outlined">menu</span>
                </button>
                <Avatar name={active.name} src={active.avatarUrl} />
                <div className="min-w-0">
                  <h1 className="truncate text-base font-semibold text-[var(--foreground)]">{active.name}</h1>
                  <p className="truncate text-xs text-[var(--text-muted)]">{active.request.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="min-h-10 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] lg:hidden"
                  onClick={() => (showOrderCta ? setOrderOpen(true) : setDealPanelOpen(true))}
                >
                  {showOrderCta ? t("Order") : t("Deal")}
                </button>
                <span className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-medium capitalize text-[var(--text-muted)]">
                  {active.status}
                </span>
              </div>
            </header>

            {error && (
              <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 lg:px-6">
                {error}
              </div>
            )}

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 lg:px-6">
              {active.messages.length === 0 && (
                <div className="app-card mx-auto mt-10 max-w-sm rounded-lg p-5 text-center text-sm text-[var(--text-muted)]">
                  {t("Start the conversation with")} {active.name}.
                </div>
              )}

              {active.messages.map((message) => {
                const mine = message.senderId === user.id;
                return (
                  <div key={message.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                    {!mine && <Avatar name={active.name} src={active.avatarUrl} size="sm" />}
                    <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      <div
                        className={`rounded-lg px-3.5 py-2 text-sm leading-relaxed ${
                          message.failed
                            ? "border border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
                            : mine
                              ? "bg-[var(--foreground)] text-[var(--background)]"
                              : "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
                        }`}
                      >
                        {message.body}
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {formatTime(message.createdAt)}
                        {message.pending ? ` · ${t("Sending")}` : ""}
                        {message.failed ? ` · ${t("Failed")}` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {showOrderCta && dealState && (
              <div className="border-t border-primary/25 bg-primary/8 px-4 py-3 lg:px-6">
                <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{t("Ready to order")}</p>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {formatCurrency(dealState.agreedPrice, dealState.agreedCurrency)}
                      {dealState.requestQuantity > 1 ? ` · ${dealState.requestQuantity} pcs` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    onClick={() => setOrderOpen(true)}
                  >
                    {t("Submit delivery details")}
                  </button>
                </div>
              </div>
            )}

            <form
              className="border-t border-[var(--border)] bg-[var(--surface)] p-4"
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage();
              }}
            >
              <div className="mx-auto flex max-w-4xl items-center gap-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={t("Type a message")}
                  className={`${panelInputClass} flex-1`}
                  maxLength={5000}
                  disabled={active.status === "closed"}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending || active.status === "closed"}
                  className="flex h-12 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-base font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
                  aria-label={t("Send message")}
                >
                  <span className="material-symbols-outlined text-[22px] sm:hidden">send</span>
                  <span className="hidden sm:inline">{t("Send message")}</span>
                </button>
              </div>
            </form>
          </>
        )}
      </main>

      {active && dealPanelOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close deal panel"
          onClick={() => setDealPanelOpen(false)}
        />
      )}
      {active && (
        <aside
          className={`${
            dealPanelOpen ? "fixed inset-y-0 right-0 z-50 flex w-full max-w-none shadow-2xl" : "hidden"
          } shrink-0 flex-col overflow-y-auto border-l border-[var(--border)] bg-[var(--surface)] lg:relative lg:flex lg:w-80 lg:max-w-none`}
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 lg:hidden">
            <p className="text-sm font-semibold text-[var(--foreground)]">{t("Deal")}</p>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
              onClick={() => setDealPanelOpen(false)}
              aria-label="Close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <section className="border-b border-[var(--border)] p-6">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Request</h2>
            <div className="space-y-3">
              <h3 className="text-lg font-bold leading-tight text-[var(--foreground)]">{active.request.title}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-[var(--surface-muted)] p-3">
                  <p className="text-xs text-[var(--text-muted)]">Budget</p>
                  <p className="font-bold text-[var(--foreground)]">{formatBudget(active)}</p>
                </div>
                <div className="rounded-lg bg-[var(--surface-muted)] p-3">
                  <p className="text-xs text-[var(--text-muted)]">Status</p>
                  <p className="font-bold capitalize text-[var(--foreground)]">{active.request.status || "active"}</p>
                </div>
              </div>
              {active.request.location && (
                <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                  {active.request.location}
                </p>
              )}
            </div>
          </section>

          {active.offer && (
            <section className="border-b border-[var(--border)] p-6">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Offer</h2>
              <div className="rounded-lg border border-[var(--border)] p-4">
                {(() => {
                  const qty = normalizeRequestQuantity(active.request.quantity);
                  const unit = Number(active.offer.price);
                  const total = computeOfferLineTotal(unit, qty);
                  return (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        Price per unit · qty {qty}
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                        {formatCurrency(unit, active.offer.currency)}
                      </p>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Order total:{" "}
                        <span className="font-bold text-[var(--foreground)]">
                          {formatCurrency(total, active.offer.currency)}
                        </span>
                      </p>
                    </>
                  );
                })()}
                <p className="mt-1 text-sm font-semibold capitalize text-[var(--text-muted)]">{active.offer.status}</p>
              </div>
            </section>
          )}

          <section className="border-b border-[var(--border)] p-6">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Price &amp; order</h2>
            {dealLoading && !dealState ? (
              <p className="text-sm text-[var(--text-muted)]">Loading deal…</p>
            ) : dealState ? (
              <div className="space-y-4">
                {dealState.orderId ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
                      Paid —{" "}
                      <Link className="font-bold underline" href={`/orders/${dealState.orderId}`}>
                        view order
                      </Link>
                    </div>
                    {dealState.orderShipping &&
                    (dealState.orderShipping.name ||
                      dealState.orderShipping.phone ||
                      dealState.orderShipping.address) ? (
                      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm">
                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                          {isSellerOnThread ? "Buyer delivery details" : "Your delivery details"}
                        </p>
                        {dealState.orderShipping.name ? (
                          <p className="font-semibold text-[var(--foreground)]">{dealState.orderShipping.name}</p>
                        ) : null}
                        {dealState.orderShipping.address ? (
                          <p className="mt-1 whitespace-pre-wrap text-[var(--foreground)]">
                            {dealState.orderShipping.address}
                          </p>
                        ) : null}
                        {dealState.orderShipping.phone ? (
                          <p className="mt-2 text-[var(--text-muted)]">
                            {t("Phone")}: {dealState.orderShipping.phone}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {dealState.initialOffer && !dealState.orderId && (
                  <div className="space-y-2">
                    <p className="text-xs text-[var(--text-muted)]">
                      Seller offer: {formatCurrency(dealState.initialOffer.unitPrice, dealState.initialOffer.currency)}{" "}
                      × {dealState.initialOffer.quantity} ={" "}
                      <span className="font-bold text-[var(--foreground)]">
                        {formatCurrency(dealState.initialOffer.totalPrice, dealState.initialOffer.currency)}
                      </span>
                    </p>
                    <button
                      type="button"
                      disabled={dealBusy}
                      onClick={async () => {
                        if (!active) return;
                        setDealBusy(true);
                        try {
                          const d = await postApplyOfferTotal(active.id);
                          setDealState(d);
                          setProposeAmount("");
                        } catch (e) {
                          setError((e as Error).message || "Could not use offer total.");
                        } finally {
                          setDealBusy(false);
                        }
                      }}
                      className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      Use offer total
                    </button>
                  </div>
                )}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                  <p className="text-xs text-[var(--text-muted)] mb-1">
                    Your counter (order total
                    {dealState.requestQuantity > 1 ? ` · ${dealState.requestQuantity} pcs` : ""})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={proposeAmount}
                      onChange={(e) => setProposeAmount(e.target.value)}
                      placeholder={DEFAULT_CURRENCY}
                      className="min-w-0 flex-1 rounded-md border border-[var(--border)] px-2 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      disabled={dealBusy || !proposeAmount}
                      onClick={async () => {
                        if (!active) return;
                        const n = Number(proposeAmount);
                        if (!Number.isFinite(n) || n <= 0) return;
                        setDealBusy(true);
                        try {
                          const d = await postPriceProposal(active.id, {
                            amount: n,
                            currency: DEFAULT_CURRENCY,
                          });
                          setDealState(d);
                          setProposeAmount("");
                        } catch (e) {
                          setError((e as Error).message || "Could not send proposal.");
                        } finally {
                          setDealBusy(false);
                        }
                      }}
                      className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
                    >
                      Offer
                    </button>
                  </div>
                </div>
                {dealState.agreedPrice != null && dealState.agreedCurrency && !dealState.orderId ? (
                  <div className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
                    <p className="font-bold text-[var(--foreground)]">
                      Agreed total: {formatCurrency(dealState.agreedPrice, dealState.agreedCurrency)}
                      {dealState.requestQuantity > 1 ? (
                        <span className="block text-xs font-normal text-[var(--text-muted)]">
                          {dealState.requestQuantity} pcs
                        </span>
                      ) : null}
                    </p>
                    {canPlaceOrderAsBuyer ? (
                      <button
                        type="button"
                        className="mt-2 w-full rounded-lg bg-primary py-2 text-xs font-semibold text-white hover:opacity-90"
                        onClick={() => setOrderOpen(true)}
                      >
                        Submit delivery details
                      </button>
                    ) : isSellerOnThread ? (
                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        Waiting for the buyer to submit delivery details and create the order.
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-[var(--text-muted)]">Waiting for buyer to submit delivery details…</p>
                    )}
                  </div>
                ) : null}
                <div>
                  <p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">
                    Recent proposals <span className="font-normal">(order totals)</span>
                  </p>
                  <ul className="max-h-40 space-y-2 overflow-y-auto text-sm">
                    {dealState.proposals.length === 0 ? (
                      <li className="text-[var(--text-muted)]">No price proposals yet.</li>
                    ) : (
                      dealState.proposals.map((p) => {
                        const mine = p.proposerId === user?.id;
                        const canAccept = !mine && p.status === "pending";
                        return (
                          <li
                            key={p.id}
                            className="flex items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5"
                          >
                            <span className="truncate">
                              {formatCurrency(p.amount, p.currency)}{" "}
                              <span className="text-xs text-[var(--text-muted)]">
                                {mine ? "(you)" : ""} · {p.status}
                              </span>
                            </span>
                            {canAccept ? (
                              <button
                                type="button"
                                disabled={dealBusy}
                                className="shrink-0 text-xs font-bold text-primary hover:underline disabled:opacity-50"
                                onClick={async () => {
                                  setDealBusy(true);
                                  try {
                                    const d = await acceptPriceProposal(p.id);
                                    setDealState(d);
                                  } catch (e) {
                                    setError((e as Error).message || "Accept failed.");
                                  } finally {
                                    setDealBusy(false);
                                  }
                                }}
                              >
                                Accept
                              </button>
                            ) : null}
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Deal tools unavailable.</p>
            )}
          </section>

          <section className="p-6">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {active.role === "seller" ? "Seller" : "Buyer"}
            </h2>
            <div className="mb-5 flex items-center gap-4">
              <Avatar name={active.name} src={active.avatarUrl} size="lg" />
              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold text-[var(--foreground)]">{active.name}</h3>
                <p className="text-sm capitalize text-[var(--text-muted)]">{active.role}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              {active.details.businessType && (
                <div className="flex justify-between gap-3 border-b border-dashed border-[var(--border)] pb-2">
                  <span className="text-[var(--text-muted)]">Business</span>
                  <span className="font-medium text-[var(--foreground)]">{active.details.businessType}</span>
                </div>
              )}
              {active.details.city && (
                <div className="flex justify-between gap-3 border-b border-dashed border-[var(--border)] pb-2">
                  <span className="text-[var(--text-muted)]">City</span>
                  <span className="font-medium text-[var(--foreground)]">{active.details.city}</span>
                </div>
              )}
              {active.details.ratingAverage && (
                <div className="flex justify-between gap-3 border-b border-dashed border-[var(--border)] pb-2">
                  <span className="text-[var(--text-muted)]">Rating</span>
                  <span className="font-medium text-[var(--foreground)]">{Number(active.details.ratingAverage).toFixed(1)}</span>
                </div>
              )}
              {typeof active.details.completedDealsCount === "number" && (
                <div className="flex justify-between gap-3 border-b border-dashed border-[var(--border)] pb-2">
                  <span className="text-[var(--text-muted)]">Deals</span>
                  <span className="font-medium text-[var(--foreground)]">{active.details.completedDealsCount}</span>
                </div>
              )}
            </div>
          </section>
        </aside>
      )}
      {orderOpen && active && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="app-card max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl p-6 shadow-[var(--shadow-card)]">
            <h3 className="mb-1 text-lg font-bold text-[var(--foreground)]">Delivery details</h3>
            {dealState?.agreedPrice != null && dealState.agreedCurrency && (
              <p className="mb-2 text-base font-bold text-[var(--foreground)]">
                {formatCurrency(dealState.agreedPrice, dealState.agreedCurrency)}
                {dealState.requestQuantity > 1 ? ` · ${dealState.requestQuantity} pcs` : ""}
              </p>
            )}
            <p className="mb-4 text-sm text-[var(--text-muted)]">
              Enter your name, phone, and address. Payment and delivery are arranged directly with the seller.
            </p>
            <ShippingFields
              value={shippingForm}
              onChange={(patch) => setShippingForm((s) => ({ ...s, ...patch }))}
              inputClassName={panelInputClass}
            />
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-lg border border-[var(--border)] py-2.5 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                onClick={() => {
                  setOrderOpen(false);
                  setShippingForm(EMPTY_SHIPPING);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={dealBusy || validateShipping(shippingForm) != null}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                onClick={async () => {
                  const validationError = validateShipping(shippingForm);
                  if (validationError) {
                    setError(validationError);
                    return;
                  }
                  setDealBusy(true);
                  try {
                    await placeRequestOrderConversation(active.id, shippingForm);
                    await loadDealState(active.id);
                    setOrderOpen(false);
                    setShippingForm(EMPTY_SHIPPING);
                  } catch (e) {
                    setError((e as Error).message || "Could not create order.");
                  } finally {
                    setDealBusy(false);
                  }
                }}
              >
                {dealBusy ? "Processing…" : "Create order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <main className="app-fill-below-header flex flex-1 items-center justify-center bg-[var(--background)] px-4">
          <p className="text-sm text-[var(--text-muted)]">Loading chat...</p>
        </main>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
