'use client';

import { useCallback, useEffect, useState } from "react";
import { apiFetchWithRefresh } from "@/lib/api";

type UserRecord = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
};

type ActionLog = {
  userId: string;
  action: "blocked" | "unblocked";
  message: string;
  time: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [blockTarget, setBlockTarget] = useState<UserRecord | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [blockSaving, setBlockSaving] = useState(false);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());

      const data = await apiFetchWithRefresh<{
        users?: UserRecord[];
        data?: UserRecord[];
      }>(`/api/v1/auth/admin/users${params.toString() ? `?${params.toString()}` : ""}`, {
        service: "auth",
      });

      const items = data.users || data.data || (Array.isArray(data) ? data : []);
      setUsers(items as UserRecord[]);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(loadUsers, 300);
    return () => clearTimeout(t);
  }, [loadUsers]);

  const handleBlock = async () => {
    if (!blockTarget || blockReason.trim().length < 5) return;
    setBlockSaving(true);
    try {
      await apiFetchWithRefresh(`/api/v1/admin/users/${blockTarget.id}/block`, {
        method: "POST",
        service: "admin",
        body: JSON.stringify({ reason: blockReason.trim() }),
      });
      setActionLogs((prev) => [
        { userId: blockTarget.id, action: "blocked", message: `Blocked: ${blockReason.trim()}`, time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
      setBlockTarget(null);
      setBlockReason("");
      loadUsers();
    } catch (err: unknown) {
      setActionLogs((prev) => [
        { userId: blockTarget.id, action: "blocked", message: `Failed: ${(err as Error).message}`, time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    } finally {
      setBlockSaving(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await apiFetchWithRefresh(`/api/v1/admin/users/${userId}/unblock`, {
        method: "POST",
        service: "admin",
      });
      setActionLogs((prev) => [
        { userId, action: "unblocked", message: "User unblocked successfully", time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
      loadUsers();
    } catch (err: unknown) {
      setActionLogs((prev) => [
        { userId, action: "unblocked", message: `Failed: ${(err as Error).message}`, time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    }
  };

  const STATUS_STYLES: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    blocked: "bg-red-100 text-red-700",
    suspended: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#0d1b12]">Users</h1>
        <p className="mt-1 text-[#4c9a66]">Search, block, and manage platform users.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none placeholder:text-gray-400"
          placeholder="Search users by name, email, or ID..."
        />
      </div>

      {/* Action logs */}
      {actionLogs.length > 0 && (
        <div className="space-y-2">
          {actionLogs.slice(0, 5).map((log, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 p-3 rounded-xl border text-sm ${
                log.message.startsWith("Failed")
                  ? "bg-red-50 border-red-200 text-red-700"
                  : log.action === "blocked"
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-green-50 border-green-200 text-green-700"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {log.message.startsWith("Failed") ? "error" : log.action === "blocked" ? "block" : "check_circle"}
              </span>
              <span className="flex-1">{log.message}</span>
              <span className="text-xs opacity-60">{log.time}</span>
            </div>
          ))}
        </div>
      )}

      {/* Users table */}
      <div className="rounded-xl border border-[#e7f3eb] bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="bg-gray-50 border-b border-[#e7f3eb]">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#4c9a66]">User</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#4c9a66]">Role</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#4c9a66]">Status</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#4c9a66] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e7f3eb]">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={4} className="px-5 py-4">
                    <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-sm text-gray-400">
                  {search ? "No users match your search." : "No users found."}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[#0d1b12]">{u.name || "—"}</span>
                      <span className="text-xs text-gray-400">{u.email || u.id}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 capitalize">{u.role || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      STATUS_STYLES[u.status || "active"] || "bg-gray-100 text-gray-500"
                    }`}>
                      {u.status || "active"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {u.status === "blocked" ? (
                        <button
                          type="button"
                          onClick={() => handleUnblock(u.id)}
                          className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">lock_open</span>
                          Unblock
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setBlockTarget(u); setBlockReason(""); }}
                          className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">block</span>
                          Block
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Block modal */}
      {blockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setBlockTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#0d1b12]">Block User</h3>
              <button type="button" onClick={() => setBlockTarget(null)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-red-50 rounded-xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-red-600">warning</span>
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Blocking {blockTarget.name || blockTarget.email || blockTarget.id}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    This will prevent the user from accessing the platform.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Reason</label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  rows={3}
                  maxLength={3000}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm resize-none"
                  placeholder="Provide a reason for blocking (min 5 characters)"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setBlockTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBlock}
                  disabled={blockSaving || blockReason.trim().length < 5}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {blockSaving ? "Blocking..." : "Block User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
