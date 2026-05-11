'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { apiFetchWithRefresh } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const SELLER_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDm0iUsxivA_SuKl8RFN-YRTJXEv735l3-lukZidmOvJiTHVqdFjWyUpRcInHSnNlT4Bq2Uwul7HK7PXV8ILKISsGmPcnW8utE7qgBt4avSa7x8ntXw4Oywd_4k5cshZEi8pdOLRcWsYAfYpoffhOcMinl3h_aPSaXn-3oxxJUFtxIyHZk06ubI8i7348myhBfownfFc66s4Q2u26WU-8a87dz9mQVXhJdhr3xe3hw4IzNTzqmnIw3dhpU1ciybKZNOS7q-6-2IAUA";

const SELLER_AVATAR_SM =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAvr5U-_hSwrzMR4SFkuxB0hWbvWFGba4ZkapjwRM9Eqa0L8VIPSdInOmiQSA4LgZVCuj8pDazb2jq-VZvqXP6Lp89ixoRT3UhPzUfqS4eOJkTD2HFc79P26PKsciOuBPpcPVxHD6D_Xa18bRoTQA9ss5UKdcQ-VNEgyRxZzjX5azJHeOVPI4ZwOeK1uy8e8u5gZ6IX_P90ZDHckTrDutULrKXQAgq8S4zvSL_CBNUZFnNRJ22v8tJ5Dk8q0HZVB14e543vUMAgeGc";

const SELLER_AVATAR_LG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDb55AT82h5Z8xhq8JfykywcuNlClUUDZ6C6ndEQ_i3jbjQm6jxLREMz59fGzXACZt77DJ_yFoPWzMhlznY2NB5_HgpCV8UprOzEiNsXfmZ0LK_5behjJbv_wVgyh-ODq37ozLg7RNg6K8q0WYKD5SmpHekun51Cxa27r9EVmzz44UsJA-bkv4TrRw1oVUkxZ1MOfE1Oe97HIMphamIDfi-tErwOyvqt5J-uwkKKKxJYBJno1Wj2noE0rfR1hIcARz59E8eRjLkjl0";

const PRODUCT_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAtYB8aV36wzFnIw4_HdrKS-n2xAIuW1y2YeTCX0mYXASATFhDRF0s1sf_u-nWwS8DkzJarNzdXiS5NP7rsj4OJQaa7j5YL4ty-JuPNEyURywKOra_FZHyOGMkuH0KZfQ0y0hABknw4v1iouRZ8LZKHwzlRmf5n7J9Op8mqaaQc1ZwPJRXSkG16x5ivX5R11f8Po1ZpV0fz4brbhCidQnqQcHbeSpEflcSMUg2REWqyLtjDmYUvRtth71aRvZv0aqwTZYDkmHDyA9k";

type OfferStatus = "pending" | "accepted" | "declined" | "cancelled";

type ChatMessage = {
  id: number;
  from: "me" | "seller";
  text: string;
  time: string;
  type?: "text" | "offer-sent" | "offer-received" | "image";
  offerAmount?: number;
  offerStatus?: OfferStatus;
  imageUrl?: string;
};

type Conversation = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timeAgo: string;
  online: boolean;
  unread?: boolean;
  request: { title: string; offerPrice: number; image: string };
  seller: {
    rating: number;
    reviews: number;
    joined: string;
    responseTime: string;
    location: string;
  };
  messages: ChatMessage[];
};

let nextId = 100;

function now() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [input, setInput] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await apiFetchWithRefresh<{
        data?: Array<{
          id: string;
          otherParticipant?: { name: string; avatarUrl?: string };
          lastMessage?: { body: string; createdAt: string };
          unreadCount?: number;
          buyerId?: string;
          sellerId?: string;
          messages?: Array<{ body: string; createdAt: string; senderId: string }>;
          request?: { title: string };
          offer?: { price: number };
        }>;
        items?: Array<{
          id: string;
          buyerId?: string;
          sellerId?: string;
          messages?: Array<{ body: string; createdAt: string; senderId: string }>;
          unreadCount?: number;
          request?: { title: string };
          offer?: { price: number };
        }>;
      }>("/api/v1/conversations", { service: "chat" });

      const items = data.data || data.items || (Array.isArray(data) ? data : []);
      if (items.length > 0) {
        const mapped: Conversation[] = (items as Array<{
          id: string;
          buyerId?: string;
          sellerId?: string;
          otherParticipant?: { name: string; avatarUrl?: string };
          lastMessage?: { body: string; createdAt: string };
          messages?: Array<{ body: string; createdAt: string; senderId: string }>;
          unreadCount?: number;
          request?: { title: string };
          offer?: { price: number };
        }>).map((c) => {
          const preview = c.lastMessage || c.messages?.[0];
          const otherId = user?.id === c.buyerId ? c.sellerId : c.buyerId;
          return {
            id: c.id,
            name: c.otherParticipant?.name || (otherId ? `User ${otherId.slice(0, 8)}` : "Conversation"),
            avatar: c.otherParticipant?.avatarUrl || SELLER_AVATAR,
            lastMessage: preview?.body || "No messages yet",
            timeAgo: preview?.createdAt
              ? new Date(preview.createdAt).toLocaleDateString()
              : "",
            online: false,
            unread: (c.unreadCount || 0) > 0,
            request: {
              title: c.request?.title || "Request conversation",
              offerPrice: c.offer?.price || 0,
              image: PRODUCT_IMAGE,
            },
            seller: { rating: 0, reviews: 0, joined: "", responseTime: "", location: "" },
            messages: [],
          };
        });
        setConversations(mapped);
        setActiveId(mapped[0].id);
      }
      setApiLoaded(true);
    } catch {
      setConversations([]);
      setApiLoaded(true);
    }
  }, [user?.id]);

  const loadMessages = useCallback(async (convId: string) => {
    if (!apiLoaded) return;
    try {
      const data = await apiFetchWithRefresh<{
        data?: Array<{
          id: string;
          senderId: string;
          body: string;
          createdAt: string;
          messageType?: string;
        }>;
        items?: Array<{
          id: string;
          senderId: string;
          body: string;
          createdAt: string;
          messageType?: string;
        }>;
      }>(`/api/v1/conversations/${convId}/messages`, { service: "chat" });

      const items = data.data || data.items || (Array.isArray(data) ? data : []);
      const mapped: ChatMessage[] = (items as Array<{
        id: string;
        senderId: string;
        body: string;
        createdAt: string;
        messageType?: string;
      }>).slice().reverse().map((m, i) => ({
        id: i + 1,
        from: m.senderId === user?.id ? ("me" as const) : ("seller" as const),
        text: m.body,
        time: new Date(m.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      }));

      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, messages: mapped } : c)),
      );
    } catch {
      // keep existing messages
    }
  }, [apiLoaded, user?.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeId && apiLoaded) {
      loadMessages(activeId);
      apiFetchWithRefresh(`/api/v1/conversations/${activeId}/read`, {
        method: "POST",
        service: "chat",
      }).catch(() => {});
    }
  }, [activeId, apiLoaded, loadMessages]);

  const active = conversations.find((c) => c.id === activeId);

  const filteredConversations = useMemo(() => {
    if (!chatSearch.trim()) return conversations;
    const q = chatSearch.toLowerCase();
    return conversations.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q),
    );
  }, [conversations, chatSearch]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [active?.messages]);

  const updateMessages = (convId: string, updater: (msgs: ChatMessage[]) => ChatMessage[]) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const newMsgs = updater(c.messages);
        const last = newMsgs[newMsgs.length - 1];
        return {
          ...c,
          messages: newMsgs,
          lastMessage: last?.text || last?.offerAmount ? `Offer: $${last.offerAmount?.toFixed(2)}` : c.lastMessage,
          timeAgo: "now",
        };
      }),
    );
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    updateMessages(activeId, (msgs) => [
      ...msgs,
      { id: nextId++, from: "me", text, time: now() },
    ]);
    setInput("");

    try {
      await apiFetchWithRefresh(`/api/v1/conversations/${activeId}/messages`, {
        method: "POST",
        service: "chat",
        body: JSON.stringify({ body: text, messageType: "text" }),
      });
    } catch {
      // message already shown locally
    }
  };

  const handleOfferAction = (msgId: number, action: "accept" | "decline" | "cancel") => {
    updateMessages(activeId, (msgs) =>
      msgs.map((m) => {
        if (m.id !== msgId) return m;
        const newStatus: OfferStatus = action === "accept" ? "accepted" : action === "decline" ? "declined" : "cancelled";
        return { ...m, offerStatus: newStatus };
      }),
    );

    if (action === "accept") {
      setTimeout(() => {
        updateMessages(activeId, (msgs) => [
          ...msgs,
          { id: nextId++, from: "seller", text: "Great, request confirmed. Let's finalize details here in chat.", time: now() },
        ]);
      }, 800);
    }
  };

  const switchChat = (id: string) => {
    setActiveId(id);
    setMobileSidebar(false);
    setInput("");
  };

  if (!active) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-[#f5f6f8] px-4">
        <div className="max-w-md rounded-2xl border border-[#e7f3eb] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined">forum</span>
          </div>
          <h1 className="text-xl font-bold text-[#0d1b12]">No active conversations</h1>
          <p className="mt-2 text-sm text-[#4c9a66]">
            Chats appear after a buyer accepts an offer or opens a request conversation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-[#f5f6f8]">
      {/* Left Sidebar: Conversations List */}
      <aside
        className={`${
          mobileSidebar ? "fixed inset-0 z-50 w-full" : "hidden lg:flex"
        } w-80 xl:w-96 flex-col border-r border-[#e7f3eb] bg-white shrink-0 z-10`}
      >
        <div className="p-4 border-b border-[#e7f3eb]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#0d1b12]">Messages</h2>
            <div className="flex items-center gap-2">
              <button
                className="lg:hidden text-[#4c9a66] hover:text-[#0d1b12]"
                onClick={() => setMobileSidebar(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <button className="text-primary hover:opacity-80">
                <span className="material-symbols-outlined">edit_square</span>
              </button>
            </div>
          </div>
          <div className="flex w-full items-stretch rounded-lg h-10 bg-[#f5f6f8]">
            <div className="text-[#4c9a66] flex items-center justify-center pl-3">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input
              className="flex w-full bg-transparent border-none text-[#0d1b12] focus:ring-0 h-full placeholder:text-[#4c9a66] px-3 text-sm"
              placeholder="Search chats..."
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              type="button"
              onClick={() => switchChat(conv.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 border-l-4 cursor-pointer transition-colors text-left ${
                activeId === conv.id
                  ? "bg-primary/10 border-primary"
                  : "border-transparent hover:bg-[#f5f6f8]"
              }`}
            >
              <div className="relative shrink-0">
                <div
                  className="bg-center bg-no-repeat bg-cover rounded-full size-12"
                  style={{ backgroundImage: `url("${conv.avatar}")` }}
                />
                {conv.online && (
                  <span className="absolute bottom-0 right-0 size-3 bg-primary border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <p className={`text-[#0d1b12] truncate ${activeId === conv.id ? "font-semibold" : "font-medium"}`}>
                    {conv.name}
                  </p>
                  <p className="text-[#4c9a66] text-xs shrink-0 ml-2">{conv.timeAgo}</p>
                </div>
                <p className="text-[#4c9a66] text-sm truncate">{conv.lastMessage}</p>
              </div>
            </button>
          ))}
          {filteredConversations.length === 0 && (
            <p className="text-center text-sm text-[#4c9a66] py-8">No chats found.</p>
          )}
        </div>
      </aside>

      {/* Center: Chat Interface */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f5f6f8] relative">
        {/* Chat Header */}
        <div className="flex-none flex items-center justify-between px-6 py-3 border-b border-[#e7f3eb] bg-white z-10">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-[#4c9a66] hover:text-[#0d1b12]"
              onClick={() => setMobileSidebar(true)}
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="relative">
              <div
                className="bg-center bg-no-repeat bg-cover rounded-full size-10"
                style={{ backgroundImage: `url("${SELLER_AVATAR}")` }}
              />
              {active.online && (
                <span className="absolute bottom-0 right-0 size-2.5 bg-primary border-2 border-white rounded-full" />
              )}
            </div>
            <div>
              <h3 className="text-[#0d1b12] font-bold text-base leading-tight">
                {active.name}
              </h3>
              <p className="text-[#4c9a66] text-xs flex items-center gap-1">
                {active.online ? (
                  <>Active now <span className="size-1 rounded-full bg-primary inline-block" /></>
                ) : (
                  "Offline"
                )}
              </p>
            </div>
          </div>
          <button className="size-8 flex items-center justify-center text-[#4c9a66] hover:text-[#0d1b12] rounded-full hover:bg-[#f5f6f8] transition-colors">
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>
        </div>

        {/* Chat Content */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Platform scope */}
          <div className="flex justify-center">
            <div className="bg-[#e7f3eb]/50 px-4 py-2 rounded-lg flex items-start gap-2 max-w-lg">
              <span className="material-symbols-outlined text-[#4c9a66] text-[18px] mt-0.5">shield</span>
              <p className="text-xs text-[#4c9a66] leading-tight">
                <span className="font-bold text-[#0d1b12]">Platform scope:</span> Mollmart connects buyers and sellers. Final commercial details are agreed outside the system.
              </p>
            </div>
          </div>

          {/* Date Separator */}
          <div className="flex justify-center">
            <span className="text-xs font-medium text-[#4c9a66] bg-white px-3 py-1 rounded-full shadow-sm">
              Today
            </span>
          </div>

          {/* Messages */}
          {active.messages.map((m) => {
            if (m.type === "offer-received") {
              return (
                <div key={m.id} className="flex gap-3 max-w-[85%]">
                  <div
                    className="bg-center bg-no-repeat bg-cover rounded-full size-8 shrink-0 self-end mb-1"
                    style={{ backgroundImage: `url("${SELLER_AVATAR_SM}")` }}
                  />
                  <div className="flex flex-col gap-2">
                    <div className="bg-white border-2 border-[#e7f3eb] rounded-2xl rounded-bl-none shadow-lg overflow-hidden min-w-[280px]">
                      <div className="bg-[#f5f6f8] px-4 py-2 border-b border-[#e7f3eb] flex justify-between items-center">
                        <span className="text-[10px] font-bold text-[#4c9a66] uppercase tracking-widest">Incoming Offer</span>
                        <span className="material-symbols-outlined text-[#4c9a66] text-sm">sell</span>
                      </div>
                      <div className="p-4 flex flex-col items-center gap-1">
                        <p className="text-[#4c9a66] text-xs">{active.name} suggests a new price</p>
                        <p className="text-3xl font-black text-[#0d1b12]">${m.offerAmount?.toFixed(2)}</p>
                        {m.offerStatus === "accepted" && (
                          <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full mt-1">Accepted</span>
                        )}
                        {m.offerStatus === "declined" && (
                          <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full mt-1">Declined</span>
                        )}
                      </div>
                      {m.offerStatus === "pending" && (
                        <div className="flex border-t border-[#e7f3eb]">
                          <button
                            type="button"
                            onClick={() => handleOfferAction(m.id, "decline")}
                            className="flex-1 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors border-r border-[#e7f3eb]"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOfferAction(m.id, "accept")}
                            className="flex-1 py-3 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
                          >
                            Accept
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-[#4c9a66] ml-1">{m.time}</span>
                  </div>
                </div>
              );
            }

            if (m.type === "offer-sent") {
              return (
                <div key={m.id} className="flex flex-row-reverse gap-3 max-w-[85%] ml-auto">
                  <div className="flex flex-col gap-2 items-end">
                    <div className={`bg-white border-2 rounded-2xl rounded-br-none shadow-xl overflow-hidden min-w-[280px] ${
                      m.offerStatus === "accepted" ? "border-green-400" : m.offerStatus === "declined" || m.offerStatus === "cancelled" ? "border-red-300" : "border-primary"
                    }`}>
                      <div className={`px-4 py-2 border-b flex justify-between items-center ${
                        m.offerStatus === "accepted"
                          ? "bg-green-50 border-green-200"
                          : m.offerStatus === "declined" || m.offerStatus === "cancelled"
                            ? "bg-red-50 border-red-200"
                            : "bg-primary/10 border-primary/20"
                      }`}>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${
                          m.offerStatus === "accepted" ? "text-green-600" : m.offerStatus === "declined" || m.offerStatus === "cancelled" ? "text-red-500" : "text-primary"
                        }`}>
                          {m.offerStatus === "pending" ? "Pending Offer" : m.offerStatus === "accepted" ? "Offer Accepted" : m.offerStatus === "declined" ? "Offer Declined" : "Offer Cancelled"}
                        </span>
                        <span className={`material-symbols-outlined text-sm ${
                          m.offerStatus === "accepted" ? "text-green-600" : m.offerStatus === "declined" || m.offerStatus === "cancelled" ? "text-red-500" : "text-primary"
                        }`}>
                          {m.offerStatus === "accepted" ? "check_circle" : m.offerStatus === "declined" || m.offerStatus === "cancelled" ? "cancel" : "handshake"}
                        </span>
                      </div>
                      <div className="p-4 flex flex-col items-center gap-1">
                        <p className="text-[#4c9a66] text-xs">Your offer for {active.request.title}</p>
                        <p className={`text-3xl font-black ${m.offerStatus === "declined" || m.offerStatus === "cancelled" ? "text-[#0d1b12]/40 line-through" : "text-[#0d1b12]"}`}>
                          ${m.offerAmount?.toFixed(2)}
                        </p>
                        {m.offerStatus === "pending" && (
                          <p className="text-[10px] text-[#4c9a66] italic mt-1">Wait for seller to respond...</p>
                        )}
                      </div>
                      {m.offerStatus === "pending" && (
                        <div className="flex border-t border-[#e7f3eb]">
                          <button
                            type="button"
                            onClick={() => handleOfferAction(m.id, "cancel")}
                            className="flex-1 py-3 text-xs font-bold text-[#4c9a66] hover:bg-[#f5f6f8] transition-colors border-r border-[#e7f3eb]"
                          >
                            Cancel Offer
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newPrice = prompt("Enter new price:", String(m.offerAmount));
                              if (!newPrice) return;
                              const num = Number(newPrice);
                              if (Number.isNaN(num) || num <= 0) return;
                              updateMessages(activeId, (msgs) =>
                                msgs.map((msg) => (msg.id === m.id ? { ...msg, offerAmount: num } : msg)),
                              );
                            }}
                            className="flex-1 py-3 text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
                          >
                            Edit Price
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-[#4c9a66] mr-1">
                      {m.time} • {m.offerStatus === "pending" ? "Sent" : m.offerStatus === "accepted" ? "Accepted ✓" : m.offerStatus === "declined" ? "Declined" : "Cancelled"}
                    </span>
                  </div>
                </div>
              );
            }

            if (m.from === "seller") {
              return (
                <div key={m.id} className="flex gap-3 max-w-[80%]">
                  <div
                    className="bg-center bg-no-repeat bg-cover rounded-full size-8 shrink-0 self-end mb-1"
                    style={{ backgroundImage: `url("${SELLER_AVATAR_SM}")` }}
                  />
                  <div className="flex flex-col gap-1">
                    <div className="bg-white text-[#0d1b12] p-3 rounded-2xl rounded-bl-none shadow-sm border border-[#e7f3eb]">
                      <p className="text-sm leading-relaxed">{m.text}</p>
                    </div>
                    {m.type === "image" && m.imageUrl && (
                      <div className="flex gap-2 mt-1">
                        <div
                          className="bg-white p-2 rounded-lg border border-[#e7f3eb] w-24 h-24 bg-cover bg-center cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundImage: `url("${m.imageUrl}")` }}
                        />
                      </div>
                    )}
                    <span className="text-[10px] text-[#4c9a66] ml-1">{m.time}</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={m.id} className="flex flex-row-reverse gap-3 max-w-[80%] ml-auto">
                <div className="flex flex-col gap-1 items-end">
                  <div className="bg-primary text-green-950 p-3 rounded-2xl rounded-br-none shadow-md">
                    <p className="text-sm leading-relaxed font-medium">{m.text}</p>
                  </div>
                  <span className="text-[10px] text-[#4c9a66] mr-1">{m.time}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Area */}
        <div className="flex-none p-4 bg-white border-t border-[#e7f3eb]">
            <form
              className="flex items-end gap-2 max-w-4xl mx-auto"
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            >
              <button
                type="button"
                className="size-10 flex items-center justify-center text-[#4c9a66] hover:text-primary rounded-full hover:bg-[#f5f6f8] transition-colors shrink-0"
              >
                <span className="material-symbols-outlined">add_circle</span>
              </button>
              <button
                type="button"
                className="size-10 flex items-center justify-center text-[#4c9a66] hover:text-primary rounded-full hover:bg-[#f5f6f8] transition-colors shrink-0"
              >
                <span className="material-symbols-outlined">image</span>
              </button>
              <div className="flex-1 bg-[#f5f6f8] rounded-2xl border border-transparent focus-within:border-primary/50 transition-colors flex items-center px-4 py-2 min-h-[48px]">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-transparent border-none focus:ring-0 p-0 text-[#0d1b12] placeholder:text-[#4c9a66]"
                />
                <button type="button" className="text-[#4c9a66] hover:text-[#0d1b12] ml-2 shrink-0">
                  <span className="material-symbols-outlined text-[20px]">mood</span>
                </button>
              </div>
              <button
                type="submit"
                className="size-12 flex items-center justify-center bg-primary hover:brightness-110 text-white rounded-full shadow-lg shadow-primary/30 transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-[24px]">send</span>
              </button>
            </form>
        </div>
      </main>

      {/* Right Sidebar: Context Panel */}
      <aside className="hidden xl:flex w-80 flex-col border-l border-[#e7f3eb] bg-white shrink-0 overflow-y-auto">
        {/* Request Info */}
        <div className="p-6 border-b border-[#e7f3eb]">
          <h4 className="text-xs font-bold text-[#4c9a66] uppercase tracking-wider mb-4">
            Related Request
          </h4>
          <div className="bg-[#f5f6f8] rounded-xl overflow-hidden border border-[#e7f3eb] group cursor-pointer">
            <div
              className="aspect-[4/3] bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
              style={{ backgroundImage: `url("${active.request.image}")` }}
            />
            <div className="p-3">
              <h3 className="font-bold text-[#0d1b12] text-lg leading-tight mb-1">
                {active.request.title}
              </h3>
              {active.request.offerPrice > 0 && (
                <p className="text-primary font-bold text-xl">
                  Accepted offer: ${active.request.offerPrice.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Seller Info */}
        <div className="p-6">
          <h4 className="text-xs font-bold text-[#4c9a66] uppercase tracking-wider mb-4">
            Seller Details
          </h4>
          <div className="flex items-center gap-4 mb-4">
            <div
              className="bg-center bg-no-repeat bg-cover rounded-full size-16"
              style={{ backgroundImage: `url("${SELLER_AVATAR_LG}")` }}
            />
            <div>
              <h3 className="font-bold text-[#0d1b12] text-lg">{active.name}</h3>
              <div className="flex items-center gap-1 text-yellow-400">
                <span className="material-symbols-outlined text-[16px] filled">star</span>
                <span className="text-[#0d1b12] text-sm font-bold ml-1">
                  {active.seller.rating}
                </span>
                <span className="text-[#4c9a66] text-xs font-normal">
                  ({active.seller.reviews} reviews)
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[#e7f3eb] border-dashed">
              <span className="text-[#4c9a66] text-sm">Joined</span>
              <span className="text-[#0d1b12] text-sm font-medium">{active.seller.joined}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#e7f3eb] border-dashed">
              <span className="text-[#4c9a66] text-sm">Response Time</span>
              <span className="text-[#0d1b12] text-sm font-medium">{active.seller.responseTime}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#e7f3eb] border-dashed">
              <span className="text-[#4c9a66] text-sm">Location</span>
              <span className="text-[#0d1b12] text-sm font-medium">{active.seller.location}</span>
            </div>
          </div>
          <div className="mt-6">
            <button className="w-full text-[#0d1b12] border border-[#e7f3eb] rounded-lg py-2.5 text-sm font-bold hover:bg-[#f5f6f8] transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[20px]">storefront</span>
              View Profile
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
