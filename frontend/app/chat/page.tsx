'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetchWithRefresh } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

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

function formatCurrency(value?: string | number | null, currency = "USD") {
  if (value == null || value === "") return "";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatBudget(conversation: Conversation) {
  const { budgetMin, budgetMax, currency } = conversation.request;
  const min = formatCurrency(budgetMin, currency || "USD");
  const max = formatCurrency(budgetMax, currency || "USD");
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
    <div className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-[#d7f7df] font-bold text-[#0d1b12]`}>
      {initials(name)}
    </div>
  );
}

function ChatPageContent() {
  const { user, loading: authLoading } = useAuth();
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

  const active = conversations.find((conversation) => conversation.id === activeId);

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

  useEffect(() => {
    if (!authLoading) {
      void loadConversations();
    }
  }, [authLoading, loadConversations]);

  useEffect(() => {
    if (!activeId) return;
    void loadMessages(activeId);
    apiFetchWithRefresh(`/api/v1/conversations/${activeId}/read`, {
      method: "POST",
      service: "chat",
    }).catch(() => {});
  }, [activeId, loadMessages]);

  useEffect(() => {
    if (!user?.id) return;
    const interval = window.setInterval(() => {
      void loadConversations({ silent: true });
      if (activeId) {
        void loadMessages(activeId, { silent: true });
      }
    }, 8000);

    return () => window.clearInterval(interval);
  }, [activeId, loadConversations, loadMessages, user?.id]);

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
      <main className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#f5f6f8]">
        <p className="text-sm font-medium text-[#4c9a66]">Loading chat...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#f5f6f8] px-4">
        <div className="w-full max-w-sm rounded-lg border border-[#e7f3eb] bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-[#0d1b12]">Sign in required</h1>
          <p className="mt-2 text-sm text-[#4c9a66]">Please log in to view your messages.</p>
        </div>
      </main>
    );
  }

  if (conversations.length === 0) {
    return (
      <main className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#f5f6f8] px-4">
        <div className="w-full max-w-md rounded-lg border border-[#e7f3eb] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined">forum</span>
          </div>
          <h1 className="text-xl font-bold text-[#0d1b12]">No conversations yet</h1>
          <p className="mt-2 text-sm text-[#4c9a66]">Chats will appear after an accepted offer.</p>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#f5f6f8]">
      <aside
        className={`${
          mobileListOpen ? "fixed inset-0 z-50 flex w-full" : "hidden lg:flex"
        } w-80 shrink-0 flex-col border-r border-[#e7f3eb] bg-white xl:w-96`}
      >
        <div className="border-b border-[#e7f3eb] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0d1b12]">Messages</h2>
            <button
              type="button"
              className="lg:hidden rounded-full p-2 text-[#4c9a66] hover:bg-[#f5f6f8]"
              onClick={() => setMobileListOpen(false)}
              aria-label="Close conversations"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <label className="flex h-10 items-center rounded-lg bg-[#f5f6f8] px-3 text-[#4c9a66]">
            <span className="material-symbols-outlined text-[20px]">search</span>
            <input
              className="h-full min-w-0 flex-1 border-none bg-transparent px-3 text-sm text-[#0d1b12] outline-none placeholder:text-[#4c9a66]"
              placeholder="Search messages"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
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
              className={`flex w-full items-center gap-3 border-l-4 px-4 py-3 text-left transition-colors ${
                conversation.id === activeId
                  ? "border-primary bg-primary/10"
                  : "border-transparent hover:bg-[#f5f6f8]"
              }`}
            >
              <Avatar name={conversation.name} src={conversation.avatarUrl} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate font-semibold text-[#0d1b12]">{conversation.name}</p>
                  <span className="shrink-0 text-xs text-[#4c9a66]">{formatTime(conversation.lastMessageAt)}</span>
                </div>
                <p className="truncate text-sm text-[#4c9a66]">{conversation.lastMessage}</p>
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
            <header className="flex items-center justify-between border-b border-[#e7f3eb] bg-white px-4 py-3 lg:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="rounded-full p-2 text-[#4c9a66] hover:bg-[#f5f6f8] lg:hidden"
                  onClick={() => setMobileListOpen(true)}
                  aria-label="Open conversations"
                >
                  <span className="material-symbols-outlined">menu</span>
                </button>
                <Avatar name={active.name} src={active.avatarUrl} />
                <div className="min-w-0">
                  <h1 className="truncate text-base font-bold text-[#0d1b12]">{active.name}</h1>
                  <p className="truncate text-xs text-[#4c9a66]">{active.request.title}</p>
                </div>
              </div>
              <span className="rounded-full bg-[#e7f3eb] px-3 py-1 text-xs font-bold capitalize text-[#0d1b12]">
                {active.status}
              </span>
            </header>

            {error && (
              <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700 lg:px-6">
                {error}
              </div>
            )}

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 lg:px-6">
              {active.messages.length === 0 && (
                <div className="mx-auto mt-10 max-w-sm rounded-lg border border-[#e7f3eb] bg-white p-5 text-center text-sm text-[#4c9a66] shadow-sm">
                  Start the conversation with {active.name}.
                </div>
              )}

              {active.messages.map((message) => {
                const mine = message.senderId === user.id;
                return (
                  <div key={message.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                    {!mine && <Avatar name={active.name} src={active.avatarUrl} size="sm" />}
                    <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      <div
                        className={`rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${
                          mine
                            ? "rounded-br-sm bg-primary text-green-950"
                            : "rounded-bl-sm border border-[#e7f3eb] bg-white text-[#0d1b12]"
                        } ${message.failed ? "border border-red-300 bg-red-50 text-red-700" : ""}`}
                      >
                        {message.body}
                      </div>
                      <span className="text-[11px] text-[#4c9a66]">
                        {formatTime(message.createdAt)}
                        {message.pending ? " - Sending" : ""}
                        {message.failed ? " - Failed" : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              className="border-t border-[#e7f3eb] bg-white p-4"
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage();
              }}
            >
              <div className="mx-auto flex max-w-4xl items-end gap-3">
                <div className="flex min-h-12 flex-1 items-center rounded-2xl border border-transparent bg-[#f5f6f8] px-4 focus-within:border-primary/60">
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Type a message"
                    className="h-12 min-w-0 flex-1 border-none bg-transparent text-[#0d1b12] outline-none placeholder:text-[#4c9a66]"
                    maxLength={5000}
                    disabled={active.status === "closed"}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || sending || active.status === "closed"}
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20 transition disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send message"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </form>
          </>
        )}
      </main>

      {active && (
        <aside className="hidden w-80 shrink-0 flex-col overflow-y-auto border-l border-[#e7f3eb] bg-white xl:flex">
          <section className="border-b border-[#e7f3eb] p-6">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#4c9a66]">Request</h2>
            <div className="space-y-3">
              <h3 className="text-lg font-bold leading-tight text-[#0d1b12]">{active.request.title}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-[#f5f6f8] p-3">
                  <p className="text-xs text-[#4c9a66]">Budget</p>
                  <p className="font-bold text-[#0d1b12]">{formatBudget(active)}</p>
                </div>
                <div className="rounded-lg bg-[#f5f6f8] p-3">
                  <p className="text-xs text-[#4c9a66]">Status</p>
                  <p className="font-bold capitalize text-[#0d1b12]">{active.request.status || "active"}</p>
                </div>
              </div>
              {active.request.location && (
                <p className="flex items-center gap-2 text-sm text-[#4c9a66]">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                  {active.request.location}
                </p>
              )}
            </div>
          </section>

          {active.offer && (
            <section className="border-b border-[#e7f3eb] p-6">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#4c9a66]">Offer</h2>
              <div className="rounded-lg border border-[#e7f3eb] p-4">
                <p className="text-2xl font-black text-[#0d1b12]">
                  {formatCurrency(active.offer.price, active.offer.currency)}
                </p>
                <p className="mt-1 text-sm font-semibold capitalize text-[#4c9a66]">{active.offer.status}</p>
              </div>
            </section>
          )}

          <section className="p-6">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#4c9a66]">
              {active.role === "seller" ? "Seller" : "Buyer"}
            </h2>
            <div className="mb-5 flex items-center gap-4">
              <Avatar name={active.name} src={active.avatarUrl} size="lg" />
              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold text-[#0d1b12]">{active.name}</h3>
                <p className="text-sm capitalize text-[#4c9a66]">{active.role}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              {active.details.businessType && (
                <div className="flex justify-between gap-3 border-b border-dashed border-[#e7f3eb] pb-2">
                  <span className="text-[#4c9a66]">Business</span>
                  <span className="font-medium text-[#0d1b12]">{active.details.businessType}</span>
                </div>
              )}
              {active.details.city && (
                <div className="flex justify-between gap-3 border-b border-dashed border-[#e7f3eb] pb-2">
                  <span className="text-[#4c9a66]">City</span>
                  <span className="font-medium text-[#0d1b12]">{active.details.city}</span>
                </div>
              )}
              {active.details.ratingAverage && (
                <div className="flex justify-between gap-3 border-b border-dashed border-[#e7f3eb] pb-2">
                  <span className="text-[#4c9a66]">Rating</span>
                  <span className="font-medium text-[#0d1b12]">{Number(active.details.ratingAverage).toFixed(1)}</span>
                </div>
              )}
              {typeof active.details.completedDealsCount === "number" && (
                <div className="flex justify-between gap-3 border-b border-dashed border-[#e7f3eb] pb-2">
                  <span className="text-[#4c9a66]">Deals</span>
                  <span className="font-medium text-[#0d1b12]">{active.details.completedDealsCount}</span>
                </div>
              )}
            </div>
          </section>
        </aside>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 justify-center px-4 py-16">
          <p className="text-sm text-[#4c9a66]">Loading chat...</p>
        </main>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
