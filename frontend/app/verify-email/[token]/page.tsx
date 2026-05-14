'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { verifyEmailToken } from "@/lib/emailVerification";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const params = useParams<{ token: string }>();
  const token = useMemo(() => {
    const raw = params?.token;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    let cancelled = false;
    verifyEmailToken(token)
      .then((res) => {
        if (cancelled) return;
        setStatus("success");
        setMessage(res.message || "Email verification successful.");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const e = err as Error;
        setStatus("error");
        setMessage(e.message || "Invalid or expired verification link.");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const icon = status === "success" ? "mark_email_read" : status === "error" ? "error" : "hourglass_top";
  const iconClass = status === "success" ? "bg-green-100 text-green-700" : status === "error" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f5f6f8] p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/60">
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${iconClass}`}>
          <span className="material-symbols-outlined text-4xl">{icon}</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          {status === "success" ? "Email verified" : status === "error" ? "Verification failed" : "Checking link"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/login" className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90">
            Go to login
          </Link>
          {status === "error" ? (
            <Link href="/register" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Create account again
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
