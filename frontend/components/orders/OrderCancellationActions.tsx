"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { createOrderCancellationRequest } from "@/lib/orderCancellation";
import { isTerminalOrderStatus, type OrderStatus } from "@/lib/orderStatus";
import ModalPortal from "@/components/ui/ModalPortal";

type Props = {
  orderId: string;
  orderStatus: OrderStatus;
  hasPendingRequest?: boolean;
  compact?: boolean;
  onSubmitted?: () => void;
};

export default function OrderCancellationActions({
  orderId,
  orderStatus,
  hasPendingRequest = false,
  compact,
  onSubmitted,
}: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(hasPendingRequest);

  if (isTerminalOrderStatus(orderStatus)) {
    return null;
  }

  if (submitted || hasPendingRequest) {
    return (
      <span
        className={`inline-flex items-center rounded-lg border border-amber-400/40 bg-amber-500/10 text-amber-800 dark:text-amber-200 ${
          compact ? "px-2.5 py-1.5 text-xs font-semibold" : "px-3 py-2 text-sm font-medium"
        }`}
      >
        {t("Cancellation pending review")}
      </span>
    );
  }

  const submit = async () => {
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      setError(t("Please describe why (at least 5 characters)."));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await createOrderCancellationRequest(orderId, trimmed);
      setSubmitted(true);
      setOpen(false);
      setReason("");
      onSubmitted?.();
    } catch (err: unknown) {
      setError((err as Error).message || t("Could not submit request."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className={
          compact
            ? "inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
            : "inline-flex items-center justify-center rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
        }
      >
        {t("Request cancellation")}
      </button>

      {open ? (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
            onClick={() => !submitting && setOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-[var(--foreground)]">{t("Request cancellation")}</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                {t("An admin will review your request. The order stays active until approved.")}
              </p>
              <label className="mt-4 block">
                <span className="text-xs font-medium text-[var(--text-muted)]">{t("Reason")}</span>
                <textarea
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setError("");
                  }}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]"
                  placeholder={t("Describe why this order should be cancelled…")}
                />
              </label>
              {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-[var(--border)] py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void submit()}
                  className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? t("Submitting…") : t("Submit request")}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </>
  );
}
