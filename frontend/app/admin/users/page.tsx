'use client';

import { useCallback, useEffect, useState } from "react";
import { apiFetchWithRefresh } from "@/lib/api";
import {
  fetchAdminUsers,
  patchAdminUser,
  revokeAdminUserSessions,
  type AdminUserRecord,
} from "@/lib/admin";
import { SearchField } from "@/components/ui/SearchField";

type ActionLog = {
  userId: string;
  action: "blocked" | "unblocked" | "deleted" | "updated" | "sessions";
  message: string;
  time: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [blockTarget, setBlockTarget] = useState<AdminUserRecord | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [blockSaving, setBlockSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRecord | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUserRecord | null>(null);
  const [editRole, setEditRole] = useState<AdminUserRecord["role"]>("buyer");
  const [editStatus, setEditStatus] = useState<AdminUserRecord["status"]>("active");
  const [editSaving, setEditSaving] = useState(false);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers(page, 20, {
        search,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      setUsers(data.users ?? []);
      setMeta(data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, page, roleFilter, statusFilter]);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSaving(true);
    try {
      await apiFetchWithRefresh(`/api/v1/auth/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
        service: "auth",
      });
      setActionLogs((prev) => [
        { userId: deleteTarget.id, action: "deleted", message: "User account deleted", time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
      setDeleteTarget(null);
      loadUsers();
    } catch (err: unknown) {
      setActionLogs((prev) => [
        { userId: deleteTarget.id, action: "deleted", message: `Failed: ${(err as Error).message}`, time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    } finally {
      setDeleteSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setEditSaving(true);
    try {
      await patchAdminUser(editTarget.id, { role: editRole, status: editStatus });
      setActionLogs((prev) => [
        {
          userId: editTarget.id,
          action: "updated",
          message: `Updated role=${editRole}, status=${editStatus}`,
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      setEditTarget(null);
      loadUsers();
    } catch (err: unknown) {
      setActionLogs((prev) => [
        { userId: editTarget.id, action: "updated", message: `Failed: ${(err as Error).message}`, time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    } finally {
      setEditSaving(false);
    }
  };

  const handleRevokeSessions = async (userId: string) => {
    try {
      await revokeAdminUserSessions(userId);
      setActionLogs((prev) => [
        { userId, action: "sessions", message: "All sessions revoked", time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    } catch (err: unknown) {
      setActionLogs((prev) => [
        { userId, action: "sessions", message: `Failed: ${(err as Error).message}`, time: new Date().toLocaleTimeString() },
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
        <p className="mt-1 text-[#4c9a66]">Search, filter, edit roles, revoke sessions, and manage accounts.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[220px] flex-1">
          <SearchField
            value={search}
            onChange={(v) => {
              setPage(1);
              setSearch(v);
            }}
            placeholder="Search by name, email, or user ID…"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setPage(1);
            setRoleFilter(e.target.value);
          }}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
        >
          <option value="">All roles</option>
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {actionLogs.length > 0 && (
        <div className="space-y-2">
          {actionLogs.slice(0, 5).map((log, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 p-3 rounded-xl border text-sm ${
                log.message.startsWith("Failed")
                  ? "bg-red-50 border-red-200 text-red-700"
                  : log.action === "blocked" || log.action === "deleted"
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-green-50 border-green-200 text-green-700"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">info</span>
              <span className="flex-1">{log.message}</span>
              <span className="text-xs opacity-60">{log.time}</span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-[#e7f3eb] bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[720px]">
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
                  {search || roleFilter || statusFilter ? "No users match your filters." : "No users found."}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[#0d1b12]">{u.name || "—"}</span>
                      <span className="text-xs text-gray-400">{u.email || u.id}</span>
                      <span className="text-[10px] font-mono text-gray-300 mt-0.5">{u.id}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 capitalize">{u.role || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        STATUS_STYLES[u.status || "active"] || "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {u.status || "active"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditTarget(u);
                          setEditRole(u.role ?? "buyer");
                          setEditStatus(u.status ?? "active");
                        }}
                        className="text-sm font-medium text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRevokeSessions(u.id)}
                        className="text-sm font-medium text-amber-700 hover:text-amber-900"
                      >
                        Revoke sessions
                      </button>
                      {u.status === "blocked" ? (
                        <button
                          type="button"
                          onClick={() => void handleUnblock(u.id)}
                          className="text-sm font-medium text-green-600 hover:text-green-800"
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setBlockTarget(u);
                            setBlockReason("");
                          }}
                          className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                          Block
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(u)}
                        className="text-sm font-medium text-gray-500 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Page {meta.page} / {Math.max(1, meta.totalPages)} · {meta.total} users
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-gray-200 px-3 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-gray-200 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

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
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={3}
                maxLength={3000}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm resize-none"
                placeholder="Reason (min 5 characters)"
                autoFocus
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setBlockTarget(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-bold">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleBlock()}
                  disabled={blockSaving || blockReason.trim().length < 5}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-50"
                >
                  {blockSaving ? "Blocking…" : "Block"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setEditTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#0d1b12]">Edit user</h3>
              <p className="text-xs text-gray-500 mt-1">{editTarget.email || editTarget.id}</p>
            </div>
            <div className="p-6 space-y-4">
              <label className="block text-sm">
                <span className="font-semibold text-gray-700">Role</span>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as AdminUserRecord["role"])}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-semibold text-gray-700">Status</span>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AdminUserRecord["status"])}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                  <option value="suspended">Suspended</option>
                </select>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditTarget(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-bold">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleEdit()}
                  disabled={editSaving}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-50"
                >
                  {editSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-5">
              <p className="text-sm font-semibold text-red-800">
                Delete {deleteTarget.name || deleteTarget.email || deleteTarget.id}?
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-bold">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleteSaving}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-50"
                >
                  {deleteSaving ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
