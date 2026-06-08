'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { formatCatalogMoney } from "@/lib/catalog";
import { resolveUploadedAssetUrl } from "@/lib/api";
import { fetchMyOrders, type ShopOrder } from "@/lib/shop";

const STATUS_TABS: { id: "all" | ShopOrder["status"]; label: string }[] = [
  { id: "all", label: "All orders" },
  { id: "processing", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

const PAGE_SIZE = 10;

const STATUS_STYLES: Record<
  ShopOrder["status"],
  { label: string; dot: string; bg: string; text: string; border: string }
> = {
  delivered: {
    label: "Delivered",
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/20",
  },
  shipped: {
    label: "Shipped",
    dot: "bg-sky-500",
    bg: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-500/20",
  },
  processing: {
    label: "Processing",
    dot: "bg-amber-500",
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/20",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-rose-500",
    bg: "bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/20",
  },
};

function StatusBadge({ status }: { status: ShopOrder["status"] }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text} ${style.border}`}
    >
      <span className={`size-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

function formatOrderDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { activeRole } = useWorkspace();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]["id"]>("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ShopOrder[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const status = activeTab === "all" ? undefined : activeTab;
      const data = await fetchMyOrders(page, PAGE_SIZE, status);
      setItems(data.items ?? []);
      setMeta(data.meta ?? { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
    } catch (e: unknown) {
      const err = e as Error & { status?: number };
      setError(err.message || "Failed to load orders");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, page, activeTab]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?returnUrl=${encodeURIComponent("/orders")}`);
      return;
    }
    void load();
  }, [authLoading, user, router, load]);

  const handleTabChange = (id: (typeof STATUS_TABS)[number]["id"]) => {
    setActiveTab(id);
    setPage(1);
  };

  const isSellerView = activeRole === "seller" || user?.role === "admin";

  const totalPages = Math.max(1, meta.totalPages);
  const rows = useMemo(() => {
    return items.map((order) => {
      const rawThumb = order.lines[0]?.imageUrl ?? "";
      const thumb = resolveUploadedAssetUrl(rawThumb) ?? "";
      const title =
        order.lines.length === 1
          ? (order.lines[0]?.title ?? "Order")
          : `${order.lines[0]?.title ?? "Items"} +${order.lines.length - 1}`;
      const counterparty = isSellerView ? order.buyer.name : order.seller.name;
      const counterpartyLabel = isSellerView ? "Buyer" : "Seller";
      return { order, thumb, title, counterparty, counterpartyLabel };
    });
  }, [items, isSellerView]);

  if (authLoading || (!user && !error)) {
    return <div className="app-page py-16 text-center text-[var(--text-muted)]">Loading…</div>;
  }

  if (!user) return null;

  return (
    <div className="app-page flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
          {isSellerView ? "Order history" : "My orders"}
        </h1>
        <p className="max-w-2xl text-sm text-[var(--text-muted)] sm:text-base">
          {isSellerView
            ? "Orders from paid request deals and catalog checkout. Open one to see details and tracking."
            : "Orders after checkout or demo payment in chat. Track status and details here."}
        </p>
      </header>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STATUS_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-primary text-white shadow-sm"
                  : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-primary/30 hover:text-[var(--foreground)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <section className="flex flex-col gap-3">
        {loading ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center text-sm text-[var(--text-muted)]">
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
            <span className="material-symbols-outlined mb-3 text-4xl text-[var(--text-muted)]">receipt_long</span>
            <p className="text-sm text-[var(--text-muted)]">
              No orders yet.{" "}
              {isSellerView ? (
                <Link href="/seller/products/new" className="font-semibold text-primary hover:underline">
                  List a product
                </Link>
              ) : (
                <Link href="/products" className="font-semibold text-primary hover:underline">
                  Browse catalog
                </Link>
              )}
            </p>
          </div>
        ) : (
          rows.map(({ order, thumb, title, counterparty, counterpartyLabel }) => {
            const canTrack = order.status === "shipped" || order.status === "delivered";
            const href = canTrack ? `/orders/${order.id}/tracking` : `/orders/${order.id}`;
            const actionLabel = canTrack ? "Track" : "Details";

            return (
              <article
                key={order.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-primary/25 hover:shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
                  <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                    <div
                      className="size-14 shrink-0 rounded-lg border border-[var(--border-muted)] bg-[var(--surface-muted)] bg-cover bg-center sm:size-16"
                      style={thumb ? { backgroundImage: `url("${thumb}")` } : undefined}
                      role="img"
                      aria-label={title}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start gap-2 gap-y-1">
                        <h2 className="min-w-0 flex-1 text-base font-semibold leading-snug text-[var(--foreground)] sm:text-lg">
                          {title}
                        </h2>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-1.5 text-xs text-[var(--text-muted)] sm:text-sm">
                        {counterpartyLabel}: <span className="text-[var(--foreground)]">{counterparty}</span>
                        <span className="mx-2 text-[var(--border)]">·</span>
                        <span className="font-mono text-[11px] sm:text-xs">{order.id.slice(0, 12)}…</span>
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-muted)] sm:hidden">{formatOrderDate(order.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-muted)] pt-4 lg:shrink-0 lg:flex-nowrap lg:justify-end lg:gap-5 lg:border-t-0 lg:pt-0">
                    <p className="hidden text-sm text-[var(--text-muted)] lg:block">{formatOrderDate(order.createdAt)}</p>
                    <p className="text-base font-semibold tabular-nums text-[var(--foreground)]">
                      {formatCatalogMoney(order.total, order.currency, 2)}
                    </p>
                    <Link
                      href={href}
                      className={
                        canTrack
                          ? "inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                          : "inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-semibold text-primary transition hover:border-primary/40 hover:bg-primary/5"
                      }
                    >
                      {actionLabel}
                      {!canTrack && <span className="material-symbols-outlined text-base">arrow_forward</span>}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {!loading && rows.length > 0 && (
        <footer className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm text-[var(--text-muted)]">
            Page <span className="font-semibold text-[var(--foreground)]">{meta.page}</span> of{" "}
            <span className="font-semibold text-[var(--foreground)]">{totalPages}</span>
            <span className="mx-2 text-[var(--border)]">·</span>
            <span className="font-semibold text-[var(--foreground)]">{meta.total}</span> orders
          </p>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1}
              className="flex size-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={meta.page >= totalPages}
              className="flex size-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
