import Link from "next/link";

export default function RegisterPage() {
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
            Join over 10,000+ sellers and buyers who have found their perfect marketplace today.
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

          <form className="space-y-5">
            {/* Account Type Selection */}
            <div className="grid grid-cols-2 gap-4 p-1 bg-primary/5 rounded-xl border border-primary/10">
              <label className="cursor-pointer">
                <input
                  defaultChecked
                  className="peer sr-only"
                  name="account_type"
                  type="radio"
                  value="buyer"
                />
                <div className="flex items-center justify-center gap-2 rounded-lg py-3 px-4 text-sm font-semibold transition-all peer-checked:bg-white peer-checked:text-primary peer-checked:shadow-sm text-slate-600 peer-checked:animate-[popScale_0.2s_ease-out]">
                  <span className="material-symbols-outlined text-lg">shopping_bag</span>
                  Buyer
                </div>
              </label>

              <label className="cursor-pointer">
                <input className="peer sr-only" name="account_type" type="radio" value="seller" />
                <div className="flex items-center justify-center gap-2 rounded-lg py-3 px-4 text-sm font-semibold transition-all peer-checked:bg-white peer-checked:text-primary peer-checked:shadow-sm text-slate-600 peer-checked:animate-[popScale_0.2s_ease-out]">
                  <span className="material-symbols-outlined text-lg">storefront</span>
                  Seller
                </div>
              </label>
            </div>

            {/* Inputs */}
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
                  name="full-name"
                  type="text"
                  placeholder="John Doe"
                  className="w-full rounded-xl border-slate-200 bg-white px-11 py-3.5 text-slate-900 focus:border-primary focus:ring-primary"
                />
              </div>
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
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="john@example.com"
                  className="w-full rounded-xl border-slate-200 bg-white px-11 py-3.5 text-slate-900 focus:border-primary focus:ring-primary"
                />
              </div>
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
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border-slate-200 bg-white px-11 py-3.5 text-slate-900 focus:border-primary focus:ring-primary"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  <span className="material-symbols-outlined text-lg">visibility</span>
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 py-2">
              <input
                id="terms"
                type="checkbox"
                className="mt-1 h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary transition-transform active:scale-125"
              />
              <label className="text-sm text-slate-600" htmlFor="terms">
                I agree to the{" "}
                <a className="text-primary font-medium hover:underline" href="#">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a className="text-primary font-medium hover:underline" href="#">
                  Privacy Policy
                </a>
                .
              </label>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-primary py-4 text-center text-base font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Create Account
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-[#f5f6f8] px-4 text-slate-500">Or sign up with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="text-xs text-slate-400">© 2024 Mollmart Inc. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

