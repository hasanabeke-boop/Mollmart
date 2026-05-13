'use client';

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchWithRefresh } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type NotificationCategory = "all" | "requests" | "messages" | "offers";

type ApiNotification = {
  id: string;
  type?: string;
  title?: string;
  message?: string;
  body?: string;
  referenceType?: string;
  referenceId?: string;
  isRead?: boolean;
  createdAt?: string;
};

type NotificationItem = {
  id: string;
  category: NotificationCategory | "system";
  title: string;
  body: string;
  time: string;
  unread: boolean;
  iconType: "request" | "message" | "offer" | "system";
  backendType: string;
  referenceType?: string;
  referenceId?: string;
};

function tabCategoryFromType(type: string): NotificationCategory | "system" {
  switch (type) {
    case "request_published":
      return "requests";
    case "offer_created":
    case "offer_accepted":
      return "offers";
    case "chat_message_created":
      return "messages";
    case "user_blocked":
    case "moderation_case_created":
      return "system";
    default:
      return "system";
  }
}

function iconFromType(type: string): NotificationItem["iconType"] {
  switch (type) {
    case "request_published":
      return "request";
    case "chat_message_created":
      return "message";
    case "offer_created":
    case "offer_accepted":
      return "offer";
    default:
      return "system";
  }
}

function resolveHref(
  item: Pick<NotificationItem, "referenceType" | "referenceId" | "backendType">,
  role: "buyer" | "seller" | "admin",
): string | null {
  const refType = item.referenceType;
  const refId = item.referenceId;
  if (!refType || !refId) return null;

  switch (refType) {
    case "request":
      return role === "seller" ? "/browse-buyer-requests" : "/my-requests";
    case "offer":
      if (item.backendType === "offer_accepted") return "/seller/dashboard";
      return "/my-requests";
    case "conversation":
      return `/chat?c=${encodeURIComponent(refId)}`;
    case "user":
      return "/profile";
    case "moderation_case":
      return "/admin/moderation";
    default:
      return null;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function mapApiToItems(rows: ApiNotification[]): NotificationItem[] {
  return rows.map((n) => {
    const backendType = n.type || "";
    const cat = tabCategoryFromType(backendType);
    return {
      id: n.id,
      category: cat,
      title: n.title || "Notification",
      body: n.body || n.message || "",
      time: n.createdAt ? timeAgo(n.createdAt) : "",
      unread: !n.isRead,
      iconType: iconFromType(backendType),
      backendType,
      referenceType: n.referenceType,
      referenceId: n.referenceId,
    };
  });
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [category, setCategory] = useState<NotificationCategory>("all");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetchWithRefresh<
        ApiNotification[] | { data?: ApiNotification[] }
      >("/api/v1/notifications", { service: "notification" });

      const arr = Array.isArray(data) ? data : (data.data || []);
      setItems(mapApiToItems(arr));
    } catch (err: unknown) {
      const msg = (err as Error).message || "Could not load notifications.";
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    void loadNotifications();
  }, [authLoading, user, loadNotifications]);

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (category === "all") return true;
      if (n.category === "system") return false;
      return n.category === category;
    });
  }, [items, category]);

  const unreadCount = useMemo(
    () => items.filter((n) => n.unread).length,
    [items],
  );

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await apiFetchWithRefresh("/api/v1/notifications/read-all", {
        method: "POST",
        service: "notification",
      });
      await loadNotifications();
    } catch {
      await loadNotifications();
    }
  };

  const handleClick = async (item: NotificationItem) => {
    const href = user ? resolveHref(item, user.role) : null;
    setItems((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n)),
    );
    try {
      await apiFetchWithRefresh(`/api/v1/notifications/${item.id}/read`, {
        method: "POST",
        service: "notification",
      });
    } catch {
      // still navigate if applicable
    }
    if (href) router.push(href);
  };

  if (authLoading) {
    return (
      <main className="flex flex-1 justify-center py-16 px-4">
        <p className="text-sm text-[#4c9a66]">Loading…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex flex-1 justify-center py-16 px-4">
        <div className="flex max-w-md flex-col gap-4 rounded-2xl border border-[#e7f3eb] bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black text-[#0d1b12]">Notifications</h1>
          <p className="text-sm text-[#4c9a66]">
            Sign in to see offers, messages, and updates about your requests.
          </p>
          <Link
            href="/login"
            className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 justify-center py-8 px-4 md:px-6">
      <div className="flex flex-col max-w-[960px] w-full gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
              Notifications
            </h1>
            <p className="text-[#4c9a66] text-base">
              Stay updated with your latest account activity
              {unreadCount > 0 ? ` · ${unreadCount} unread` : ""}.
            </p>
          </div>
          <button
            type="button"
            className="text-xs font-bold text-[#4c9a66] bg-[#e7f3eb] px-3 py-2 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
            onClick={() => void loadNotifications()}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
            {" "}
            <button
              type="button"
              className="font-bold underline"
              onClick={() => void loadNotifications()}
            >
              Retry
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center border-b border-[#e7f3eb] pb-0 gap-4">
          <div className="flex gap-6 md:gap-8 overflow-x-auto w-full sm:w-auto no-scrollbar">
            {[
              { id: "all", label: "All" },
              { id: "requests", label: "Requests" },
              { id: "messages", label: "Messages" },
              { id: "offers", label: "Offers" },
            ].map((tab) => {
              const active = category === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategory(tab.id as NotificationCategory)}
                  className={`relative pb-3 text-sm font-bold transition-colors ${
                    active
                      ? "text-[#0d1b12]"
                      : "text-[#4c9a66] hover:text-primary"
                  }`}
                >
                  {tab.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            className="pb-3 text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1 disabled:opacity-40"
            disabled={loading || items.length === 0 || unreadCount === 0}
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            Mark all as read
          </button>
        </div>

        {/* Notification list */}
        <div className="flex flex-col gap-3">
          {loading && items.length === 0 && (
            <p className="text-sm text-[#4c9a66] mt-2">Loading notifications…</p>
          )}

          {!loading && filtered.map((item) => {
            const href = resolveHref(item, user.role);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => void handleClick(item)}
                className={`group relative flex gap-4 p-4 rounded-xl shadow-sm transition-all text-left ${
                  item.unread
                    ? "bg-white border border-transparent hover:border-primary/30 cursor-pointer"
                    : "bg-[#f5f6f8] border border-[#e7f3eb] hover:bg-white"
                } ${href ? "" : "cursor-default"}`}
              >
                {item.unread && (
                  <div className="absolute top-4 right-4 size-2.5 bg-primary rounded-full" />
                )}
                <div className="flex items-center justify-center rounded-lg shrink-0 size-12 bg-[#e0f2fe] text-blue-600">
                  {item.iconType === "request" && (
                    <span className="material-symbols-outlined">playlist_add_check</span>
                  )}
                  {item.iconType === "message" && (
                    <span className="material-symbols-outlined">chat</span>
                  )}
                  {item.iconType === "offer" && (
                    <span className="material-symbols-outlined">sell</span>
                  )}
                  {item.iconType === "system" && (
                    <span className="material-symbols-outlined">notifications</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-center gap-1 min-w-0">
                  <div className="flex justify-between items-start gap-3 pr-6">
                    <h3 className="text-base font-semibold leading-normal">
                      {item.title}
                    </h3>
                    <span className="text-xs font-medium text-[#4c9a66] whitespace-nowrap shrink-0">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-[#4c9a66] text-sm leading-relaxed max-w-2xl">
                    {item.body}
                  </p>
                  {href && (
                    <span className="text-xs font-semibold text-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Open →
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {!loading && filtered.length === 0 && !error && (
            <p className="text-sm text-[#4c9a66] mt-2">
              {category === "all"
                ? "You’re all caught up — no notifications yet."
                : "No notifications in this category yet."}
            </p>
          )}

          {!loading && items.length > 0 && (
            <p className="text-center text-xs text-[#4c9a66] mt-4">
              Showing all notifications from your account.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
