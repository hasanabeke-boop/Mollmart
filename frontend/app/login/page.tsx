export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#f5f6f8] text-slate-900">
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
          <div className="flex items-center gap-3 text-white">
            <div className="h-8 w-8">
              <svg
                fill="none"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path
                  d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tight">Mollmart</span>
          </div>

          <div>
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
              Empowering local commerce
              <br />
              and community growth.
            </h1>
            <p className="text-white/80 text-xl max-w-lg leading-relaxed">
              Join thousands of savvy shoppers and local vendors who trust Mollmart for their daily
              essentials and unique finds.
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
            <p className="text-sm text-white/90 font-medium">Joined by 10k+ local businesses</p>
          </div>
        </div>
      </div>

      {/* Right side: login form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-16 lg:p-24 bg-white">
        <div className="w-full max-w-md space-y-8 animate-[slide-in-right-bounce_0.8s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-10">
            <div className="h-6 w-6 text-primary">
              <svg
                fill="none"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
              >
                <path
                  d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">Mollmart</span>
          </div>

          <div className="text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="mt-2 text-slate-500">Please enter your details to sign in.</p>
          </div>

          <form className="space-y-6">
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
                  required
                  placeholder="name@example.com"
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder:text-slate-400 duration-300"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="block text-sm font-semibold text-slate-700"
                  htmlFor="password"
                >
                  Password
                </label>
                <a className="text-sm font-bold text-primary hover:text-primary/80 transition-colors" href="#">
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder:text-slate-400 duration-300"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                </button>
              </div>
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
              className="w-full py-4 px-6 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-primary/30"
            >
              Sign In
            </button>
          </form>

          <div className="relative py-4">
            <div aria-hidden="true" className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm font-medium leading-6">
              <span className="bg-white px-4 text-slate-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-slate-700">
              <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>

            <button className="flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-slate-700">
              <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.702z" />
              </svg>
              Apple
            </button>
          </div>

          <div className="text-center">
            <p className="text-slate-600">
              Don&apos;t have an account?
              <a
                className="font-bold text-primary hover:text-primary/80 transition-colors ml-1"
                href="#"
              >
                Sign up for free
              </a>
            </p>
          </div>
        </div>

        {/* Footer links (local for login panel) */}
        <div className="pt-10 flex gap-6 text-xs font-medium text-slate-400">
          <a className="hover:text-slate-600" href="#">
            Privacy Policy
          </a>
          <a className="hover:text-slate-600" href="#">
            Terms of Service
          </a>
          <a className="hover:text-slate-600" href="#">
            Help Center
          </a>
        </div>
      </div>
    </div>
  );
}

