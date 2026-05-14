'use client';

import { useState } from "react";
import { useAuth, type ApiError } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

export default function RegisterPage() {
  const { signup, user } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [showPw, setShowPw] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");

  if (user) {
    router.replace("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const errs: Record<string, string> = {};
    if (!username.trim()) errs.username = "Name is required";
    else if (username.trim().length < 2) errs.username = "Name must be at least 2 characters";
    if (!email.trim()) errs.email = "Email is required";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    if (!terms) errs.terms = "You must agree to the terms";
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const result = await signup(username.trim(), email, password, role);
      setVerificationToken(result.verificationToken || "");
      setRequiresEmailVerification(
        Boolean(result.requiresEmailVerification) || Boolean(result.verificationToken),
      );
      setSuccess(true);
    } catch (err: unknown) {
      const apiErr = err as Error & { status?: number; data?: ApiError };
      if (apiErr.data?.errors) {
        const map: Record<string, string> = {};
        apiErr.data.errors.forEach((e) => (map[e.field] = e.message));
        setFieldErrors(map);
      } else if (apiErr.status === 409) {
        setFieldErrors({ email: "An account with this email already exists" });
      } else {
        setError(apiErr.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const title = requiresEmailVerification ? "Verify your email" : "Account created";
    const message = requiresEmailVerification
      ? (
          <>
            Your account was created for <span className="font-semibold text-slate-900">{email}</span>.
            You need to verify your email before you can sign in. Check your inbox for a link from Mollmart
            {verificationToken ? " or use the link below for local testing." : "."}
          </>
        )
      : (
          <>
            Your Mollmart account is ready. You can log in with <span className="font-semibold text-slate-900">{email}</span>.
          </>
        );

    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f5f6f8] p-8">
        <div className="w-full max-w-md text-center space-y-6 animate-[fadeIn_0.5s_ease-out]">
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
              requiresEmailVerification ? "bg-amber-100" : "bg-green-100"
            }`}
          >
            <span
              className={`material-symbols-outlined text-4xl ${
                requiresEmailVerification ? "text-amber-600" : "text-green-600"
              }`}
            >
              {requiresEmailVerification ? "mark_email_unread" : "check_circle"}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="text-slate-600">{message}</p>
          {verificationToken && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-800">
              <p className="font-semibold">Local verification link</p>
              <Link className="mt-1 block break-all underline" href={`${API_BASE}/api/v1/verify-email/${verificationToken}`}>
                {API_BASE}/api/v1/verify-email/{verificationToken}
              </Link>
            </div>
          )}
          <div className="pt-4 space-y-3">
            <Link
              href="/login"
              className="block w-full rounded-xl bg-primary py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              Go to Login
            </Link>
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="block w-full rounded-xl border border-slate-200 py-3.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              Create Another Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row bg-[#f5f6f8] text-slate-900">
      {/* Left Side: Image / Branding (desktop) */}
      <div className="relative hidden w-full items-center justify-center bg-primary lg:flex lg:w-1/2 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent z-10" />
          <img
            alt="Entrepreneur starting a business"
            className="h-full w-full object-cover animate-[slowZoom_20s_linear_infinite_alternate]"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIFTknlQ9A6jV8lzkTEC_uqJSp1dZVZwRzaTEXIS1pKaK6i7vT_zMOzOhmuoxkeEQbXd2ww3OYbzEiUkHfEsrwp_0qZkmaRvaZoRAGUZ0gLkQIN8uVJSDa_tkai5eWRopSjRogK7GhKo7VFc93qok31z8ZpsqWn_SoRF7d2q7SIh9MjjCJgHFmBGHIoAuhpAGFm8IFtOKyR2SollDZZo9WZh7bXQBZwBHayD-VvyCK7qdG9x4dywE0cQEXnpsp-CoAWfqaDv5kM1E"
          />
        </div>

        <div className="relative z-20 px-12 text-white">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-4xl">star</span>
            <h1 className="text-3xl font-black tracking-tight">Mollmart</h1>
          </div>
          <h2 className="text-5xl font-extrabold leading-tight mb-6">
            Empower your
            <br />
            business journey.
          </h2>
          <p className="text-xl opacity-90 max-w-md">
            Join buyers posting real demand and sellers responding with relevant offers.
          </p>
          <div className="mt-12 flex gap-6">
            <div className="flex flex-col">
              <span className="text-3xl font-bold">4.9/5</span>
              <span className="text-sm opacity-80">User Rating</span>
            </div>
            <div className="h-12 w-px bg-white/20" />
            <div className="flex flex-col">
              <span className="text-3xl font-bold">24/7</span>
              <span className="text-sm opacity-80">Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Registration Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-20 xl:px-32">
        <div className="mx-auto w-full max-w-md animate-[fadeIn_0.8s_ease-out_forwards]">
          {/* Mobile logo */}
          <div className="mb-10 lg:hidden">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined font-bold">star</span>
              <span className="text-xl font-bold tracking-tight">Mollmart</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Account</h2>
            <p className="mt-2 text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Log in
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <span className="material-symbols-outlined text-[20px]">error</span>
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Account Type Selection */}
            <div className="grid grid-cols-2 gap-4 p-1 bg-primary/5 rounded-xl border border-primary/10">
              <label className="cursor-pointer">
                <input
                  className="peer sr-only"
                  name="account_type"
                  type="radio"
                  value="buyer"
                  checked={role === "buyer"}
                  onChange={() => setRole("buyer")}
                />
                <div className="flex items-center justify-center gap-2 rounded-lg py-3 px-4 text-sm font-semibold transition-all peer-checked:bg-white peer-checked:text-primary peer-checked:shadow-sm text-slate-600 peer-checked:animate-[popScale_0.2s_ease-out]">
                  <span className="material-symbols-outlined text-lg">playlist_add_check</span>
                  Buyer
                </div>
              </label>
              <label className="cursor-pointer">
                <input
                  className="peer sr-only"
                  name="account_type"
                  type="radio"
                  value="seller"
                  checked={role === "seller"}
                  onChange={() => setRole("seller")}
                />
                <div className="flex items-center justify-center gap-2 rounded-lg py-3 px-4 text-sm font-semibold transition-all peer-checked:bg-white peer-checked:text-primary peer-checked:shadow-sm text-slate-600 peer-checked:animate-[popScale_0.2s_ease-out]">
                  <span className="material-symbols-outlined text-lg">storefront</span>
                  Seller
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="full-name">
                Full Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  person
                </span>
                <input
                  id="full-name"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="John Doe"
                  className={`w-full rounded-xl bg-white px-11 py-3.5 text-slate-900 border focus:border-primary focus:ring-primary ${fieldErrors.username ? "border-red-400" : "border-slate-200"}`}
                />
              </div>
              {fieldErrors.username && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className={`w-full rounded-xl bg-white px-11 py-3.5 text-slate-900 border focus:border-primary focus:ring-primary ${fieldErrors.email ? "border-red-400" : "border-slate-200"}`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  lock
                </span>
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={`w-full rounded-xl bg-white px-11 py-3.5 text-slate-900 border focus:border-primary focus:ring-primary ${fieldErrors.password ? "border-red-400" : "border-slate-200"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPw ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            <div className="flex items-start gap-3 py-2">
              <input
                id="terms"
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className={`mt-1 h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary transition-transform active:scale-125 ${fieldErrors.terms ? "ring-2 ring-red-400" : ""}`}
              />
              <label className="text-sm text-slate-600" htmlFor="terms">
                I agree to the{" "}
                <a className="text-primary font-medium hover:underline" href="#">Terms of Service</a>{" "}
                and{" "}
                <a className="text-primary font-medium hover:underline" href="#">Privacy Policy</a>.
              </label>
            </div>
            {fieldErrors.terms && (
              <p className="-mt-3 text-sm text-red-600">{fieldErrors.terms}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-4 text-center text-base font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Creating account...
                </span>
              ) : "Create Account"}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-xs text-slate-400">(c) 2024 Mollmart Inc. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
