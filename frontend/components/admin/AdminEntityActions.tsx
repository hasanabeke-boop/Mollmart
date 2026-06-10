'use client';

import { useState } from "react";
import { deleteAdminContent, hideAdminContent, unhideAdminContent, type AdminEntityTargetType } from "@/lib/admin";

type Props = {
  targetType: AdminEntityTargetType;
  targetId: string;
  isHidden?: boolean;
  label?: string;
  onDone?: () => void;
  compact?: boolean;
};

export function AdminEntityActions({
  targetType,
  targetId,
  isHidden = false,
  label,
  onDone,
  compact = false,
}: Props) {
  const [busy, setBusy] = useState<"hide" | "unhide" | "delete" | null>(null);
  const [error, setError] = useState("");

  const run = async (action: "hide" | "unhide" | "delete") => {
    if (action === "delete") {
      const name = label || targetId;
      if (!window.confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    }
    setBusy(action);
    setError("");
    try {
      if (action === "hide") await hideAdminContent(targetType, targetId);
      else if (action === "unhide") await unhideAdminContent(targetType, targetId);
      else await deleteAdminContent(targetType, targetId);
      onDone?.();
    } catch (e: unknown) {
      setError((e as Error).message || "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const btn = compact
    ? "text-xs font-bold px-2 py-1 rounded border"
    : "text-sm font-medium px-3 py-1.5 rounded-lg border";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className={`flex flex-wrap gap-1.5 ${compact ? "justify-end" : ""}`}>
        {isHidden ? (
          <button
            type="button"
            disabled={busy != null}
            onClick={() => void run("unhide")}
            className={`${btn} border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50`}
          >
            {busy === "unhide" ? "…" : "Unblock"}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy != null}
            onClick={() => void run("hide")}
            className={`${btn} border-amber-200 text-amber-800 hover:bg-amber-50 disabled:opacity-50`}
          >
            {busy === "hide" ? "…" : "Block"}
          </button>
        )}
        <button
          type="button"
          disabled={busy != null}
          onClick={() => void run("delete")}
          className={`${btn} border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50`}
        >
          {busy === "delete" ? "…" : "Delete"}
        </button>
      </div>
      {error ? <p className="text-[10px] text-red-600 max-w-[180px] text-right">{error}</p> : null}
    </div>
  );
}
