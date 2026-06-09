"use client";

import { useState } from "react";
import ModalPortal from "@/components/ui/ModalPortal";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import {
  REPORT_REASON_PRESETS,
  submitContentReport,
  type ReportTargetType,
} from "@/lib/moderationReports";

type Props = {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
};

export default function ReportContentModal({
  open,
  onClose,
  targetType,
  targetId,
  targetLabel,
}: Props) {
  const { t } = useLanguage();
  const { success: toastSuccess, error: toastError } = useToast();
  const [preset, setPreset] = useState<string>(REPORT_REASON_PRESETS[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const buildReason = () => {
    const extra = details.trim();
    if (preset === "Other") {
      return extra.length >= 5 ? extra : "";
    }
    return extra.length > 0 ? `${preset}: ${extra}` : preset;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const reason = buildReason();
    if (reason.length < 5) {
      setError(t("Please describe the issue (at least 5 characters)."));
      return;
    }

    setSubmitting(true);
    try {
      await submitContentReport({ targetType, targetId, reason });
      toastSuccess(t("Report submitted. Our moderators will review it."));
      setDetails("");
      setPreset(REPORT_REASON_PRESETS[0]);
      onClose();
    } catch (err: unknown) {
      const message = (err as Error).message || t("Failed to submit report.");
      setError(message);
      toastError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <h3 className="text-lg font-bold text-[var(--foreground)]">{t("Report content")}</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--foreground)]"
              aria-label={t("Close")}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <p className="text-sm text-[var(--text-muted)]">
              {t("Reporting:")}{" "}
              <span className="font-medium text-[var(--foreground)]">{targetLabel}</span>
            </p>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">{t("Reason")}</span>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              >
                {REPORT_REASON_PRESETS.map((item) => (
                  <option key={item} value={item}>
                    {t(item)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">
                {preset === "Other" ? t("Details") : t("Additional details (optional)")}
              </span>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                maxLength={3000}
                placeholder={t("Describe what is wrong with this listing or request…")}
                className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
            </label>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
              >
                {t("Cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {submitting ? t("Sending…") : t("Submit report")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
