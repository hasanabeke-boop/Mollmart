'use client';

import { useCallback, useEffect, useState } from "react";
import { apiFetchWithRefresh } from "@/lib/api";

type NotificationCategory = "all" | "requests" | "messages" | "offers";

type NotificationItem = {
  id: string;
  category: Exclude<NotificationCategory, "all">;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  type: "request" | "message" | "offer" | "system";
};

function categorize(n: { type?: string }): Exclude<NotificationCategory, "all"> {
  const t = n.type || "";
  if (t.includes("request")) return "requests";
  if (t.includes("message") || t.includes("chat")) return "messages";
  if (t.includes("offer")) return "offers";
  return "requests";
}

function typeIcon(n: { type?: string }): NotificationItem["type"] {
  const t = n.type || "";
  if (t.includes("request")) return "request";
  if (t.includes("message") || t.includes("chat")) return "message";
  if (t.includes("offer")) return "offer";
  return "system";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const [category, setCategory] = useState<NotificationCategory>("all");
  const [items, setItems] = useState<NotificationItem[]>([]);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await apiFetchWithRefresh<
        Array<{
          id: string;
          title?: string;
          message?: string;
          body?: string;
          type?: string;
          isRead?: boolean;
          createdAt?: string;
        }> | { data?: Array<{
          id: string;
          title?: string;
          message?: string;
          body?: string;
          type?: string;
          isRead?: boolean;
          createdAt?: string;
        }> }
      >("/api/v1/notifications", { service: "notification" });

      const arr = Array.isArray(data) ? data : (data.data || []);
      setItems(
        arr.map((n) => ({
          id: n.id,
          category: categorize(n),
          title: n.title || "Notification",
          body: n.message || n.body || "",
          time: n.createdAt ? timeAgo(n.createdAt) : "",
          unread: !n.isRead,
          type: typeIcon(n),
        })),
      );
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotifications();
  }, [loadNotifications]);

  const filtered = items.filter(
    (n) => category === "all" || n.category === category,
  );

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await apiFetchWithRefresh("/api/v1/notifications/read-all", {
        method: "POST",
        service: "notification",
      });
    } catch {
      // already marked locally
    }
  };

  const handleClick = async (item: NotificationItem) => {
    setItems((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n)),
    );
    try {
      await apiFetchWithRefresh(`/api/v1/notifications/${item.id}/read`, {
        method: "POST",
        service: "notification",
      });
    } catch {
      // already marked locally
    }
  };

  const handleLoadOlder = () => {
    loadNotifications();
  };

  return (
    <main className="flex flex-1 justify-center py-8 px-4 md:px-6">
      <div className="flex flex-col max-w-[960px] w-full gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
              Notifications
            </h1>
            <p className="text-[#4c9a66] text-base">
              Stay updated with your latest account activity.
            </p>
          </div>
          <button
            type="button"
            className="text-xs font-bold text-[#4c9a66] bg-[#e7f3eb] px-3 py-2 rounded-lg hover:bg-primary/20 transition-colors"
            onClick={loadNotifications}
          >
            Refresh
          </button>
        </div>

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
            onClick={handleMarkAllRead}
            className="pb-3 text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            Mark all as read
          </button>
        </div>

        {/* Notification list */}
        <div className="flex flex-col gap-3">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item)}
              className={`group relative flex gap-4 p-4 rounded-xl shadow-sm transition-all text-left ${
                item.unread
                  ? "bg-white border border-transparent hover:border-primary/30 cursor-pointer"
                  : "bg-[#f5f6f8] border border-[#e7f3eb] hover:bg-white"
              }`}
            >
              {item.unread && (
                <div className="absolute top-4 right-4 size-2.5 bg-primary rounded-full" />
              )}
              <div className="flex items-center justify-center rounded-lg shrink-0 size-12 bg-[#e0f2fe] text-blue-600">
                {item.type === "request" && (
                  <span className="material-symbols-outlined">playlist_add_check</span>
                )}
                {item.type === "message" && (
                  <span className="material-symbols-outlined">chat</span>
                )}
                {item.type === "offer" && (
                  <span className="material-symbols-outlined">sell</span>
                )}
                {item.type === "system" && (
                  <span className="material-symbols-outlined">security</span>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-center gap-1">
                <div className="flex justify-between items-start pr-6">
                  <h3 className="text-base font-semibold leading-normal">
                    {item.title}
                  </h3>
                  <span className="text-xs font-medium text-[#4c9a66] whitespace-nowrap">
                    {item.time}
                  </span>
                </div>
                <p className="text-[#4c9a66] text-sm leading-relaxed max-w-2xl">
                  {item.body}
                </p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-[#4c9a66] mt-2">
              No notifications in this category yet.
            </p>
          )}

          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={handleLoadOlder}
              className="text-sm font-bold text-[#4c9a66] hover:text-primary px-4 py-2"
            >
              Load older notifications
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

