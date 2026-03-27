export function NewsletterSection() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#eff6ff] px-6 py-16 sm:px-16 lg:flex lg:items-center lg:px-20 border border-primary/10">
          <div className="lg:w-0 lg:flex-1 relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-[#0d1b12]">
              Sign up for our newsletter
            </h2>
            <p className="mt-4 max-w-3xl text-lg text-gray-600">
              Stay up to date with the newest demands, latest trends, and exclusive deals. We only
              send the good stuff.
            </p>
          </div>

          <div className="mt-8 lg:mt-0 lg:ml-8 relative z-10 w-full lg:w-auto">
            <form className="sm:flex">
              <label className="sr-only" htmlFor="email-address">
                Email address
              </label>
              <input
                autoComplete="email"
                className="w-full rounded-lg border-gray-300 px-5 py-3 placeholder-gray-500 focus:border-primary focus:ring-primary sm:max-w-xs transition-shadow shadow-sm"
                id="email-address"
                name="email-address"
                placeholder="Enter your email"
                required
                type="email"
              />
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3 sm:flex-shrink-0">
                <button
                  className="flex w-full items-center justify-center rounded-lg border border-transparent bg-primary px-5 py-3 text-base font-bold text-white hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-transform active:scale-95"
                  type="submit"
                >
                  Notify me
                </button>
              </div>
            </form>
            <p className="mt-3 text-sm text-gray-500">
              We care about the protection of your data. Read our{" "}
              <a className="font-medium text-primary underline" href="#">
                Privacy Policy
              </a>
              .
            </p>
          </div>

          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl animate-[pulse_5s_infinite]" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl animate-[pulse_7s_infinite]" />
        </div>
      </div>
    </section>
  );
}

