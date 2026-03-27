export function FinalCtaSection() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-[#0d1b12] px-6 py-24 text-center shadow-2xl sm:px-16 group">
          <div className="relative z-10">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to join the future of commerce?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
              Whether you&apos;re buying your dream item or selling to a waiting crowd, Mollmart makes it seamless.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button className="rounded-lg bg-primary px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary/20 hover:bg-[var(--primary-hover)] transition-all transform hover:translate-y-[-2px]">
                Get Started Now
              </button>
              <a
                className="text-sm font-semibold leading-6 text-white hover:text-primary transition-colors flex items-center gap-1"
                href="#"
              >
                Learn more <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">→</span>
              </a>
            </div>
          </div>
          <div className="absolute left-1/2 top-1/2 -z-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-20 blur-[120px] group-hover:opacity-30 transition-opacity duration-1000" />
        </div>
      </div>
    </section>
  );
}

