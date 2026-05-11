'use client';

import Link from "next/link";
import { useMemo, useState } from "react";

type FaqItem = {
  id: number;
  question: string;
  answer: string;
  category: "requests" | "selling" | "moderation" | "account";
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 1,
    category: "requests",
    question: "How do I create a strong buyer request?",
    answer:
      "Create a request with a clear title, useful product details, target budget, category, and deadline. The more specific the request is, the easier it is for sellers to respond with relevant offers.",
  },
  {
    id: 2,
    category: "selling",
    question: "How do sellers respond to buyer demand?",
    answer:
      "Sellers browse published requests, filter by relevant categories, and submit offers with price, message, and timing. If the buyer accepts, the platform opens a chat for direct negotiation.",
  },
  {
    id: 3,
    category: "moderation",
    question: "What happens after I accept an offer?",
    answer:
      "Mollmart creates a conversation between buyer and seller. From there the two sides continue discussing details directly. The platform helps with matching and communication, not checkout or delivery.",
  },
  {
    id: 4,
    category: "account",
    question: "How do I keep my account safe and trusted?",
    answer:
      "Verify your email, keep profile details current, and communicate through the platform respectfully. Admin tools support moderation, user blocking, and review of suspicious activity.",
  },
];

export default function HelpFaqPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    FaqItem["category"] | "all"
  >("all");

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const matchesQuery =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <main className="flex-1">
      {/* Hero search section */}
      <section className="flex justify-center py-5 px-4 md:px-10 lg:px-40">
        <div className="flex flex-col max-w-[960px] flex-1">
          <div className="flex flex-wrap gap-2 py-2">
            <span className="text-[#4c9a66] text-sm md:text-base font-medium">
              Help Center
            </span>
          </div>
          <div className="flex flex-col min-h-[320px] gap-6 bg-cover bg-center bg-no-repeat rounded-xl md:rounded-2xl items-center justify-center p-6 md:p-10 relative overflow-hidden bg-[linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.6))]">
            <div className="flex flex-col gap-3 text-center z-10 max-w-2xl">
              <h1 className="text-white text-3xl md:text-5xl font-black leading-tight tracking-[-0.033em]">
                Mollmart Help Center
              </h1>
              <h2 className="text-gray-200 text-base md:text-lg">
                How can we help you today?
              </h2>
            </div>
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-col min-w-[280px] h-14 w-full max-w-[560px] md:h-16 z-10 shadow-lg"
            >
              <div className="flex w-full flex-1 items-stretch rounded-lg h-full bg-[#f5f6f8] overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-shadow">
                <div className="text-[#4c9a66] flex items-center justify-center pl-4 md:pl-5">
                  <span className="material-symbols-outlined text-[24px]">
                    search
                  </span>
                </div>
                <input
                  className="flex w-full min-w-0 flex-1 bg-transparent text-[#0d1b12] focus:outline-0 placeholder:text-[#4c9a66] px-3 md:px-4 text-sm md:text-base"
                  placeholder="Search for answers (e.g. requests, offers, moderation)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <div className="flex items-center justify-center pr-2">
                  <button
                    type="submit"
                    className="flex min-w-[84px] items-center justify-center rounded-lg h-10 px-4 md:h-12 md:px-6 bg-primary hover:bg-[#0eb545] text-[#0d1b12] text-sm md:text-base font-bold tracking-[0.015em]"
                  >
                    <span className="truncate">Search</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="flex justify-center px-4 md:px-10 lg:px-40">
        <div className="flex flex-col max-w-[960px] flex-1">
          <div className="pb-6 pt-10">
            <h2 className="text-[#0d1b12] text-2xl font-bold leading-tight tracking-[-0.015em]">
              Browse by Topic
            </h2>
            <p className="text-[#4c9a66] mt-2">
              Find articles related to request posting, offers, moderation, and account usage.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-10">
            {[
              { id: "requests", label: "Requests", icon: "playlist_add_check" },
              { id: "selling", label: "Selling", icon: "sell" },
              { id: "moderation", label: "Moderation", icon: "gavel" },
              { id: "account", label: "Account", icon: "manage_accounts" },
            ].map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() =>
                    setActiveCategory(
                      active && query === ""
                        ? "all"
                        : (cat.id as FaqItem["category"]),
                    )
                  }
                  className={`group flex flex-1 gap-4 rounded-xl border bg-[#f5f6f8] p-5 flex-col text-left transition-all duration-200 ${
                    active ? "border-primary shadow-md" : "border-[#cfe7d7]"
                  }`}
                >
                  <div className="text-[#0d1b12] group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[32px]">
                      {cat.icon}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[#0d1b12] text-lg font-bold leading-tight">
                      {cat.label}
                    </h3>
                    <p className="text-[#4c9a66] text-sm">
                      {cat.id === "requests" &&
                        "How buyer requests work and how to improve them."}
                      {cat.id === "selling" &&
                        "Finding requests, sending offers, and negotiating."}
                      {cat.id === "moderation" &&
                        "Safety, blocking, and admin intervention."}
                      {cat.id === "account" &&
                        "Profile settings, security, and preferences."}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ list */}
      <section className="bg-white w-full">
        <div className="flex justify-center py-12 px-4 md:px-10 lg:px-40">
          <div className="flex flex-col max-w-[960px] flex-1">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[#0d1b12] text-2xl font-bold leading-tight">
                Frequently Asked Questions
              </h2>
              <button
                type="button"
                className="text-primary font-medium text-sm md:text-base hover:underline"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("all");
                }}
              >
                View all articles
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {filteredFaqs.length === 0 && (
                <p className="text-sm text-[#4c9a66]">
                  No articles match your search yet. Try a different keyword.
                </p>
              )}
              {filteredFaqs.map((item) => (
                <details
                  key={item.id}
                  className="group rounded-xl border border-gray-100 bg-[#f5f6f8] open:bg-white open:shadow-sm transition-all"
                  open
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between p-5 font-medium text-[#0d1b12]">
                    <span className="text-base font-semibold">
                      {item.question}
                    </span>
                    <span className="transition group-open:rotate-180">
                      <span className="material-symbols-outlined">
                        expand_more
                      </span>
                    </span>
                  </summary>
                  <div className="px-5 pb-5 pt-0 text-[#4c9a66] text-sm leading-relaxed">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact support */}
      <section className="flex justify-center py-10 px-4 md:px-10 lg:px-40 mb-10">
        <div className="flex flex-col max-w-[960px] flex-1">
          <div className="bg-[#f5f6f8] border border-[#cfe7d7] rounded-2xl p-8 md:p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-[#0eb545]">
                <span className="material-symbols-outlined">support_agent</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#0d1b12] mb-2">
              Still need help?
            </h2>
            <p className="text-[#4c9a66] mb-8 max-w-md mx-auto">
              Our support team is available 24/7 to assist you with any
              questions about requests, offers, chats, and account safety.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/chat"
                className="flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-[#0eb545] text-[#0d1b12] px-6 py-3 font-bold transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  chat
                </span>
                <span>Open Chats</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center justify-center gap-2 rounded-lg border border-[#cfe7d7] bg-white hover:bg-gray-50 text-[#0d1b12] px-6 py-3 font-semibold transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  manage_accounts
                </span>
                <span>Account Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

