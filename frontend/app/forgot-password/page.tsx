'use client';

import { useState } from "react";
import { apiFetch, type ApiError } from "@/lib/api";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/api/v1/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err: unknown) {
      const apiErr = err as Error & { data?: ApiError };
      setError(apiErr.data?.message || apiErr.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f5f6f8] p-8">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <span className="material-symbols-outlined text-4xl text-blue-600">mail</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Check your email</h2>
          <p className="text-slate-600">
            If an account exists with <span className="font-semibold">{email}</span>, we&apos;ve sent password reset instructions.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f5f6f8] p-8">
      <div className="w-full max-w-md space-y-8 bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Forgot password?</h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="email">
              Email Address
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="text-center">
          <Link href="/login" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
