import type { ReactNode } from "react";

type StatusTone = "default" | "emphasis" | "danger";

const toneClass: Record<StatusTone, string> = {
  default: "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)]",
  emphasis: "border-primary/25 bg-primary/8 text-[var(--foreground)]",
  danger: "border-red-300/40 bg-red-500/8 text-red-700 dark:border-red-500/30 dark:text-red-300",
};

export function StatusBadge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: StatusTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}

export function requestStatusTone(status: string): StatusTone {
  if (status === "cancelled") return "danger";
  if (status === "has_offers" || status === "in_negotiation" || status === "accepted") return "emphasis";
  return "default";
}

export function orderStatusTone(status: string): StatusTone {
  if (status === "cancelled") return "danger";
  if (status === "in_progress" || status === "awaiting_confirmation" || status === "completed") return "emphasis";
  return "default";
}
