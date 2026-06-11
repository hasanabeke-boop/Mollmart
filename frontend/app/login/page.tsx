'use client';

import { useState, useEffect } from "react";
import { useAuth, type ApiError } from "@/context/AuthContext";
import { getAuthenticatedHomePath } from "@/lib/authRoutes";
import { useToast } from "@/context/ToastContext";
import { apiFetch } from "@/lib/api";
import { resendVerificationEmail } from "@/lib/emailVerification";
import Link from "next/link";
import { MollmartLogo } from "@/components/brand/MollmartLogo";
import { useRouter } from "next/navigation";

function safeReturnUrl(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotResetToken, setForgotResetToken] = useState("");

  useEffect(() => {
    if (forgotOpen) {
      setForgotEmail(email.trim());
      setForgotError("");
      setForgotResetToken("");
    }
  }, [forgotOpen, email]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setReturnUrl(safeReturnUrl(params.get("returnUrl")));
    if (params.get("forgot") === "1") {
      setForgotOpen(true);
      const next = safeReturnUrl(params.get("returnUrl"));
      router.replace(next ? `/login?returnUrl=${encodeURIComponent(next)}` : "/login", { scroll: false });
    }
  }, [router]);

  if (user) {
    router.replace(returnUrl || getAuthenticatedHomePath(user));
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setVerificationToken("");
    setFieldErrors({});

    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "Email is required";
    if (!password) errs.password = "Password is required";
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const loggedIn = await login(email, password);
      router.push(returnUrl || getAuthenticatedHomePath(loggedIn));
    } catch (err: unknown) {
      const apiErr = err as Error & { status?: number; data?: ApiError };
      if (apiErr.data?.errors) {
        const map: Record<string, string> = {};
        apiErr.data.errors.forEach((e) => (map[e.field] = e.message));
        setFieldErrors(map);
      } else if (apiErr.status === 401) {
        const msg = apiErr.data?.message || "Invalid email or password";
        setError(msg);
        setNeedsVerification(/not verified|confirm your email/i.test(msg));
      } else {
        setError(apiErr.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError("");
    setVerificationToken("");
    if (!email.trim()) {
      setFieldErrors({ email: "Email is required" });
      return;
    }

    setResendingVerification(true);
    try {
      const res = await resendVerificationEmail(email.trim());
      if (res.verificationToken) {
        setVerificationToken(res.verificationToken);
      }
      toastSuccess(res.message || "Verification email sent.");
    } catch (err: unknown) {
      const apiErr = err as Error & { status?: number; data?: ApiError };
      const msg =
        apiErr.status === 409
          ? "This email is already verified. Try signing in again."
          : apiErr.data?.message || apiErr.data?.error || apiErr.message || "Could not send verification email.";
      setError(msg);
      toastError(msg);
    } finally {
      setResendingVerification(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotResetToken("");
    if (!forgotEmail.trim()) {
      setForgotError("Email is required");
      return;
    }
    setForgotLoading(true);
    try {
      const result = await apiFetch<{ message?: string; resetToken?: string }>("/api/v1/forgot-password", {
        method: "POST",
        service: "auth",
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      if (result.resetToken) {
        setForgotResetToken(result.resetToken);
        toastSuccess(result.message || "Check your email for the password reset link.");
        return;
      }
      toastSuccess("If this email is registered, we sent reset instructions.");
      setForgotOpen(false);
    } catch (err: unknown) {
      const apiErr = err as Error & { status?: number; data?: ApiError };
      if (apiErr.status === 404) {
        toastSuccess("If this email is registered, we sent reset instructions.");
        setForgotOpen(false);
        return;
      }
      const msg = apiErr.data?.message || apiErr.message || "Could not send reset email";
      setForgotError(msg);
      toastError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-below-landing-nav flex bg-[#f5f6f8] text-slate-900">
      {/* Left visual section (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-primary/80 to-primary/40" />
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center animate-[slow-zoom_20s_infinite_alternate_ease-in-out]"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD4lnhc_BJck5mdu7a-TFLqPshMzdvKkeyYhMlJVPxvKmHQMRdibaGL97X5t_qddYQn-4ICvnT-sBAgXR90XoEQkdQNh0N9JJ-4_LYU21Xa4ZsWohRc2gQFn3h433r5PQaBFCcJ1fylNf45DsVRV0ohGxFAyoPD0V9Hl1f4SkRQlV0x1DoHHir1_gql5z3k4cOxbpz-b3-at2T_snesUKkr1HdlIjCNi8rUQKxDhyZ6m4E_VjVCzotyPqLNQ1pG_7IOQSBbo93VrJs')",
          }}
        />

        <div className="relative z-20 flex flex-col justify-between p-16 w-full">
          <MollmartLogo
            size={32}
            showWordmark
            wordmarkClassName="text-2xl font-black tracking-tight text-white"
          />

          <div>
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
              Buyer requests,
              <br />
              seller offers.
            </h1>
            <p className="text-white/80 text-xl max-w-lg leading-relaxed">
              Sign in to post requests, submit offers, and continue accepted deals in chat.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              <img
                alt="User"
                className="h-10 w-10 rounded-full border-2 border-primary object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPQ-9G7bdsikqfrKVfm5PuYH6X9u9A3rr8hxrDRFzsyFHUIMV3Ujkg4zEgB5t8DFrVZGsB0OEf4v7aVYGRX-x4Rh_3YOOLGRsGinrnrG1262df9C2vypT5tZ5E1Rp14CfpQmY83kYVBqiVYxC2dhU2Fxc4u8IsWtciU7PWBztEczmKrahvBnz7v-kJs5bvCuraioginnYmY9njc_kpoG-DO6IMC9x4mAnYI3bWLtpZTri82hqiOYayWToHqm6VJt9PlO3TauCQ3WY"
              />
              <img
                alt="User"
                className="h-10 w-10 rounded-full border-2 border-primary object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2K6D8w3g5Fm2HeMotKRU0MpP7oANU8uOGlVPYdpg8sZ24v_1Pr6tC8YS3nX7sfNmr0GCqc4y-P8im4X3I2zVdcbKSy3lnQnSzKiKm2n4-9TnYKYfcrIZ0boA6Z8oYXp-FxID90SUAlxC7ifULtGVzRuB28a5_oWLEgl7G5opG0yHav4Hg36VM0xJ0kdtFYjwq95tPqZaAAISkQHUm3cAj6glM1OPFW5VEDycyVGz-q2hRy5ehMrRd5JzScxIygg1FJrDQCglx1gM"
              />
              <img
                alt="User"
                className="h-10 w-10 rounded-full border-2 border-primary object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQ84NH6Mjkx_m-tnGK6cp7V16F206YXQrOwH90uDGCvEeApi0RqMkg9eJZHL-HYrjxHxilIMaJmgKC305xg4BpE2tnFcKoUBIpMOYHq5Yg0ppPRzNbXJfDhecAlGhMX5Ap0R0KdXsUOs6dQL0LKJ9gHtdz98-cdcsVA4EF8JpQjUg_SgwhOJntMV3zknBvqGFsVgWb03oZO8_vmQeMzdx6X3oMivHfZ6Nh5W-XX0CkL5PoZ7rHI0lKWhJjOTDiEz1w2gVhvzGmtQY"
              />
            </div>
            <p className="text-sm text-white/90 font-medium">Built for direct buyer-seller matching</p>
          </div>
        </div>
      </div>

      {/* Right side: login form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-16 lg:p-24 bg-white">
        <div className="w-full max-w-md space-y-8 animate-[slide-in-right-bounce_0.8s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
          {/* Mobile logo */}
          <div className="mb-10 lg:hidden">
            <MollmartLogo
              size={28}
              showWordmark
              wordmarkClassName="text-xl font-black tracking-tight text-slate-900"
            />
          </div>

          <div className="text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="mt-2 text-slate-500">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <div className="flex-1">
                <p>{error}</p>
                {needsVerification ? (
                  <div className="mt-3 space-y-2">
                    <button
                      type="button"
                      disabled={resendingVerification}
                      onClick={handleResendVerification}
                      className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-red-700 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-60"
                    >
                      {resendingVerification ? "Sending..." : "Resend verification email"}
                    </button>
                    {verificationToken ? (
                      <Link className="block break-all text-xs font-semibold underline" href={`/verify-email/${verificationToken}`}>
                        Open local verification link
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                className="block text-sm font-semibold text-slate-700 mb-2"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`block w-full pl-11 pr-4 py-3.5 bg-white border rounded-xl focus:border-primary focus:ring-primary transition-all text-slate-900 placeholder:text-slate-400 duration-300 ${fieldErrors.email ? "border-red-400" : "border-slate-200"}`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="block text-sm font-semibold text-slate-700"
                  htmlFor="password"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={`block w-full pl-11 pr-12 py-3.5 bg-white border rounded-xl focus:border-primary focus:ring-primary transition-all text-slate-900 placeholder:text-slate-400 duration-300 ${fieldErrors.password ? "border-red-400" : "border-slate-200"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPw ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary/20 transition-all cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="ml-3 block text-sm font-medium text-slate-600 cursor-pointer"
              >
                Remember me for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <div className="text-center">
            <p className="text-slate-600">
              Don&apos;t have an account?
              <Link
                className="font-bold text-primary hover:text-primary/80 transition-colors ml-1"
                href="/register"
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </div>

        <div className="pt-10 flex gap-6 text-xs font-medium text-slate-400">
          <Link className="hover:text-slate-600" href="/privacy">Privacy Policy</Link>
          <Link className="hover:text-slate-600" href="/terms">Terms of Service</Link>
          <Link className="hover:text-slate-600" href="/help">Help Center</Link>
        </div>
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            aria-label="Close"
            onClick={() => !forgotLoading && setForgotOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
            className="relative z-[121] w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 id="forgot-password-title" className="text-xl font-bold text-slate-900">
                  Forgot password?
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter your email — we&apos;ll send a link to reset your password.
                </p>
              </div>
              <button
                type="button"
                disabled={forgotLoading}
                onClick={() => setForgotOpen(false)}
                className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {forgotError && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <span className="material-symbols-outlined shrink-0 text-[20px]">error</span>
                {forgotError}
              </div>
            )}

            {forgotResetToken && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <p className="font-semibold">Local reset link</p>
                <Link className="mt-1 block break-all underline" href={`/reset-password/${forgotResetToken}`}>
                  {typeof window !== "undefined" ? window.location.origin : ""}/reset-password/{forgotResetToken}
                </Link>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleForgotSubmit}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="forgot-email">
                  Email
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-primary">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </span>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="block w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 transition-all focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  disabled={forgotLoading}
                  onClick={() => setForgotOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {forgotLoading ? "Sending…" : "Send reset link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
