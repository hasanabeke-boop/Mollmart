'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { confirmPasswordChangeToken } from "@/lib/passwordChange";
import { setAccessToken } from "@/lib/api";

type Status = "loading" | "success" | "error";

export default function ConfirmPasswordChangePage() {
  const params = useParams<{ token: string }>();
  const token = useMemo(() => {
    const raw = params?.token;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);
  const [result, setResult] = useState<{ status: Status; message: string }>({
    status: "loading",
    message: "Confirming your new password...",
  });

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    confirmPasswordChangeToken(token)
      .then((res) => {
        if (cancelled) return;
        setAccessToken(null);
        setResult({
          status: "success",
          message: res.message || "Your password has been updated.",
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const e = err as Error;
        setResult({
          status: "error",
          message: e.message || "Invalid or expired confirmation link.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const status = token ? result.status : "error";
  const message = token ? result.message : "Confirmation token is missing.";
  const icon =
    status === "success" ? "check_circle" : status === "error" ? "error" : "hourglass_top";
  const iconClass =
    status === "success"
      ? "bg-green-100 text-green-700"
      : status === "error"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-700";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f5f6f8] p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/60">
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${iconClass}`}>
          <span className="material-symbols-outlined text-4xl">{icon}</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          {status === "success"
            ? "Password updated"
            : status === "error"
              ? "Confirmation failed"
              : "Confirming change"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
          >
            Go to login
          </Link>
          {status === "error" ? (
            <Link
              href="/profile"
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Back to profile
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
