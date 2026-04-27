'use client';

import { useCallback, useEffect, useState } from "react";
import { apiFetchWithRefresh } from "@/lib/api";

type ModerationAction = {
  id: string;
  actionType: string;
  actorId: string;
  note: string | null;
  createdAt: string;
};

type ModerationCase = {
  id: string;
  targetType: "request" | "offer" | "user";
  targetId: string;
  reason: string;
  status: "open" | "in_review" | "resolved" | "dismissed";
  createdBy: string;
  assignedTo: string | null;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  actions: ModerationAction[];
};

type CaseStatus = "open" | "in_review" | "resolved" | "dismissed";
type TargetType = "request" | "offer" | "user";

const STATUS_STYLES: Record<CaseStatus, string> = {
  open: "bg-yellow-100 text-yellow-700",
  in_review: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  dismissed: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<CaseStatus, string> = {
  open: "Open",
  in_review: "In Review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "update"; caseItem: ModerationCase };

export default function ModerationPage() {
  const [cases, setCases] = useState<ModerationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<CaseStatus | "">("");
  const [filterType, setFilterType] = useState<TargetType | "">("");
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterType) params.set("targetType", filterType);
      const qs = params.toString();

      const data = await apiFetchWithRefresh<ModerationCase[]>(
        `/api/v1/admin/moderation/cases${qs ? `?${qs}` : ""}`,
        { service: "admin" },
      );
      setCases(Array.isArray(data) ? data : []);
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = () => {
    setModal({ mode: "closed" });
    load();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0d1b12]">Moderation</h1>
          <p className="mt-1 text-[#4c9a66]">Review and manage flagged content.</p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: "create" })}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors self-start"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Create Case
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as CaseStatus | "")}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_review">In Review</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as TargetType | "")}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
        >
          <option value="">All types</option>
          <option value="request">Request</option>
          <option value="offer">Offer</option>
          <option value="user">User</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#e7f3eb] bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 border-b border-[#e7f3eb]">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#4c9a66]">Type</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#4c9a66]">Target ID</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#4c9a66]">Reason</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#4c9a66]">Status</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#4c9a66]">Assigned</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#4c9a66]">Created</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#4c9a66] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e7f3eb]">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-5 py-4">
                    <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : cases.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                  No moderation cases found.
                </td>
              </tr>
            ) : (
              cases.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0d1b12] capitalize">
                      <span className="material-symbols-outlined text-[16px] text-gray-400">
                        {c.targetType === "request" ? "description" : c.targetType === "offer" ? "local_offer" : "person"}
                      </span>
                      {c.targetType}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 font-mono max-w-[120px] truncate">{c.targetId}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 max-w-[200px] truncate">{c.reason}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${STATUS_STYLES[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{c.assignedTo || "—"}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setModal({ mode: "update", caseItem: c })}
                      className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal.mode === "create" && (
        <CreateCaseModal onClose={() => setModal({ mode: "closed" })} onSaved={handleSaved} />
      )}
      {modal.mode === "update" && (
        <UpdateCaseModal caseItem={modal.caseItem} onClose={() => setModal({ mode: "closed" })} onSaved={handleSaved} />
      )}
    </div>
  );
}

function CreateCaseModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [targetType, setTargetType] = useState<TargetType>("request");
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!targetId.trim()) { setError("Target ID is required."); return; }
    if (reason.trim().length < 5) { setError("Reason must be at least 5 characters."); return; }

    setSaving(true);
    try {
      await apiFetchWithRefresh("/api/v1/admin/moderation/cases", {
        method: "POST",
        service: "admin",
        body: JSON.stringify({
          targetType,
          targetId: targetId.trim(),
          reason: reason.trim(),
          assignedTo: assignedTo.trim() || undefined,
        }),
      });
      onSaved();
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to create case");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-[#0d1b12]">Create Moderation Case</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Target Type</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as TargetType)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm bg-white"
            >
              <option value="request">Request</option>
              <option value="offer">Offer</option>
              <option value="user">User</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Target ID</label>
            <input
              type="text"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm"
              placeholder="Enter the ID of the target entity"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={3000}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm resize-none"
              placeholder="Describe why this content is being flagged (min 5 characters)"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Assign To <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm"
              placeholder="Admin user ID"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50">
              {saving ? "Creating..." : "Create Case"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UpdateCaseModal({
  caseItem,
  onClose,
  onSaved,
}: {
  caseItem: ModerationCase;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<CaseStatus>(caseItem.status);
  const [assignedTo, setAssignedTo] = useState(caseItem.assignedTo || "");
  const [resolutionNote, setResolutionNote] = useState(caseItem.resolutionNote || "");
  const [actionType, setActionType] = useState<"hide_content" | "unhide_content" | "note">("note");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const needsResolution = status === "resolved" || status === "dismissed";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (needsResolution && resolutionNote.trim().length === 0) {
      setError("Resolution note is required when resolving or dismissing.");
      return;
    }

    setSaving(true);
    try {
      await apiFetchWithRefresh(`/api/v1/admin/moderation/cases/${caseItem.id}`, {
        method: "PATCH",
        service: "admin",
        body: JSON.stringify({
          status,
          assignedTo: assignedTo.trim() || "",
          resolutionNote: resolutionNote.trim() || "",
          actionType,
        }),
      });
      onSaved();
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to update case");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-lg font-bold text-[#0d1b12]">Manage Case</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Case info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Type:</span>{" "}
              <span className="font-medium capitalize">{caseItem.targetType}</span>
            </div>
            <div>
              <span className="text-gray-400">Target:</span>{" "}
              <span className="font-mono text-xs">{caseItem.targetId.slice(0, 12)}...</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400">Reason:</span>{" "}
              <span className="text-gray-700">{caseItem.reason}</span>
            </div>
          </div>
        </div>

        {/* History */}
        {caseItem.actions.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">History</p>
            <div className="space-y-2">
              {caseItem.actions.map((a) => (
                <div key={a.id} className="flex items-start gap-2 text-xs">
                  <span className="material-symbols-outlined text-[14px] text-gray-400 mt-0.5">circle</span>
                  <div>
                    <span className="font-medium text-gray-700 capitalize">{a.actionType.replace(/_/g, " ")}</span>
                    {a.note && <span className="text-gray-500"> — {a.note}</span>}
                    <span className="text-gray-400 ml-2">{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CaseStatus)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm bg-white"
            >
              <option value="open">Open</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Action Type</label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as "hide_content" | "unhide_content" | "note")}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm bg-white"
            >
              <option value="note">Note</option>
              <option value="hide_content">Hide Content</option>
              <option value="unhide_content">Unhide Content</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Assign To <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm"
              placeholder="Admin user ID"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Resolution Note {needsResolution && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              rows={3}
              maxLength={3000}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm resize-none"
              placeholder={needsResolution ? "Required when resolving or dismissing" : "Optional note"}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Update Case"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
