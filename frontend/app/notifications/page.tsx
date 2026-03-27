'use client';

import { useState } from "react";

type NotificationCategory = "all" | "orders" | "messages" | "promotions";

type NotificationItem = {
  id: number;
  category: Exclude<NotificationCategory, "all">;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  type: "order" | "message" | "promo" | "system";
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    category: "orders",
    title: "Order #12345 Shipped",
    body: "Your package is on its way and is estimated to arrive by Friday.",
    time: "2h ago",
    unread: true,
    type: "order",
  },
  {
    id: 2,
    category: "messages",
    title: "New Message from TechStore",
    body: '"Hi there! Regarding your question about the lens compatibility..."',
    time: "4h ago",
    unread: true,
    type: "message",
  },
  {
    id: 3,
    category: "promotions",
    title: "20% Off Vintage Cameras",
    body:
      "A selection of vintage film cameras is on sale for a limited time. Don't miss out!",
    time: "1d ago",
    unread: false,
    type: "promo",
  },
  {
    id: 4,
    category: "orders",
    title: "Order #12340 Delivered",
    body: "Your package has been delivered to your front porch.",
    time: "3d ago",
    unread: false,
    type: "order",
  },
  {
    id: 5,
    category: "orders",
    title: "Security Alert: Login Attempt",
    body: "We noticed a login from a new device. Was this you?",
    time: "2d ago",
    unread: false,
    type: "system",
  },
];

export default function NotificationsPage() {
  const [category, setCategory] = useState<NotificationCategory>("all");
  const [items, setItems] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const filtered = items.filter(
    (n) => category === "all" || n.category === category,
  );

  const handleMarkAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleClick = (item: NotificationItem) => {
    // Помечаем как прочитанное и показываем демо-действие
    setItems((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n)),
    );
    alert(`Open details for: ${item.title}`);
  };

  const handleLoadOlder = () => {
    alert("Load older notifications (demo).");
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
          <div className="flex gap-2">
            <button
              type="button"
              className="text-xs font-bold text-[#4c9a66] bg-[#e7f3eb] px-3 py-2 rounded-lg hover:bg-primary/20 transition-colors"
              onClick={() => alert("Open notification settings (demo).")}
            >
              Settings
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center border-b border-[#e7f3eb] pb-0 gap-4">
          <div className="flex gap-6 md:gap-8 overflow-x-auto w-full sm:w-auto no-scrollbar">
            {[
              { id: "all", label: "All" },
              { id: "orders", label: "Orders" },
              { id: "messages", label: "Messages" },
              { id: "promotions", label: "Promotions" },
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
                {item.type === "order" && (
                  <span className="material-symbols-outlined">local_shipping</span>
                )}
                {item.type === "message" && (
                  <span className="material-symbols-outlined">chat</span>
                )}
                {item.type === "promo" && (
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

