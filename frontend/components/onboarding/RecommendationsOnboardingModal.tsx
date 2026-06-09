'use client';

import { useEffect, useState } from "react";
import { apiFetch, apiFetchWithRefresh } from "@/lib/api";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useCategoryLabel } from "@/hooks/useCategoryLabel";

type ApiCategory = { id: string; name: string; slug: string };

export default function RecommendationsOnboardingModal({ onDone }: { onDone: () => void }) {
  const { activeMode } = useWorkspace();
  const categoryLabel = useCategoryLabel();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await apiFetch<ApiCategory[]>("/api/v1/catalog/categories", {
          service: "catalog",
        });
        if (!cancelled) setCategories(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = async (action: "complete" | "skip") => {
    setBusy(true);
    setError("");
    try {
      await apiFetchWithRefresh("/api/v1/auth/me/recommendations-onboarding", {
        method: "PATCH",
        service: "auth",
        body: JSON.stringify(
          action === "skip" ? { action: "skip" } : { action: "complete", categoryIds: selected },
        ),
      });
      onDone();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not save preferences.");
    } finally {
      setBusy(false);
    }
  };

  const hint =
    activeMode === "seller"
      ? "Pick categories you want to sell in. They power recommended buyer requests."
      : "Pick categories you care about. They power personalized showcase recommendations.";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e7f3eb] bg-white p-6 shadow-xl">
        <h2 className="text-xl font-black text-[#0d1b12]">Personalize recommendations</h2>
        <p className="mt-2 text-sm text-[#4c9a66]">{hint}</p>
        <p className="mt-1 text-xs text-slate-500">You can skip now and change this anytime in Profile → Preferences.</p>

        <div className="mt-4 max-h-48 overflow-y-auto flex flex-wrap gap-2 rounded-xl border border-[#e7f3eb] bg-[#f5f6f8] p-3">
          {categories.length === 0 ? (
            <span className="text-sm text-slate-500">Loading categories…</span>
          ) : (
            categories.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-[#e7f3eb] bg-white px-3 py-1.5 text-sm font-medium"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(c.id)}
                  onChange={() => toggle(c.id)}
                  className="rounded border-[#e7f3eb] text-primary"
                />
                {categoryLabel(c)}
              </label>
            ))
          )}
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit("skip")}
            className="rounded-lg border border-[#e7f3eb] px-4 py-2.5 text-sm font-bold text-[#0d1b12] hover:bg-[#f5f6f8] disabled:opacity-50"
          >
            Skip for now
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit("complete")}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-black hover:bg-[#0fd650] disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save & continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
