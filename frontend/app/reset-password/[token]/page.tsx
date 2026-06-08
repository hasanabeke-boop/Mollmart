'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function ResetPasswordPage() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Reset link is missing a token.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch(`/api/v1/reset-password/${encodeURIComponent(token)}`, {
        method: "POST",
        service: "auth",
        body: JSON.stringify({ newPassword: password }),
      });
      setSuccess(true);
    } catch (err: unknown) {
      const apiErr = err as Error & { data?: { message?: string; error?: string } };
      setError(apiErr.data?.message || apiErr.data?.error || apiErr.message || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f5f6f8] p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Password updated</h1>
          <p className="mt-2 text-sm text-slate-500">You can now sign in with your new password.</p>
          <Link
            href="/login"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f5f6f8] p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">Reset password</h1>
          <p className="mt-2 text-sm text-slate-500">Choose a new password for your Mollmart account.</p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="confirm-password">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </main>
  );
}
