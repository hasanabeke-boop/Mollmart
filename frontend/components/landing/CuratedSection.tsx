import Link from "next/link";

export function CuratedSection() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0d1b12] sm:text-3xl">
              Suggested For Your Role
            </h2>
            <p className="mt-2 text-gray-500">
              Recommended request flows and seller opportunities based on platform activity.
            </p>
          </div>
          <Link className="hidden sm:block font-bold text-primary hover:text-blue-700 transition-colors" href="/help">
            See all suggestions →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          <StepCard
            badge="Buyers"
            title="Post a detailed request"
            subtitle="Share specs, budget, and deadlines"
            step="Step 1"
            icon="playlist_add"
            href="/create-product-request"
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuBSvMpBvaT1NQnkZbOZBsyn_TmCJAQDAHmpVe8-Zul6hq86scLLD8u91Ut557FP0df0NKLqV3AsHVRh-TassP-XvYM1W4_rIs7NFcVn927a7JMZedVHtT29WgcGm6XaTRjU5RwPfiTsvrKFW-lLBp0XvRZIowozIAHMX5FMvojITW55akC6jLBf4UR-nBKcpujrZ_zZQrD7IW1NRN0YaoLoEnrfx2ykea0bUL5kj5V-GW0lVdpWWRCt59ZRWbnwLyiALu8SGKjB2sY"
          />
          <StepCard
            title="Match sellers to active demand"
            subtitle="Browse requests by category and intent"
            step="Step 2"
            icon="travel_explore"
            href="/browse-buyer-requests"
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuAFFDwtOJW_HASM8LMZsxOjvWdjn8LwopOO0Zgzgn6_PqV-HyfmsTcA5D1Rgb_cR-K8x6yx7IRgJO7rScP4ciLSsFlMPphHgxor7ZWZx6s0nfyrtVho7tKo7iSusqdaBxomj3vppdvZraMGVsDfUaaYkxw_LHO966IzzZedBCl2YGAUVW7N14FIMoJUi0QzRwHwxLX1cJE3hb446ldoCidPZDRpxHadYmwt5uGVBdXLB6xinkpcR9_DLG4cA0vpW6Jhd8HFXN-AOVQ"
          />
          <StepCard
            title="Compare and accept offers"
            subtitle="Evaluate price, timing, and seller fit"
            step="Step 3"
            icon="local_offer"
            href="/my-requests"
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuCF5Z737MHdxbZm1ImufTBseKF0b3j-42D8YGWF4902p8S6MTITdvCbczyfnbvWQ-xY52dE1pYE7lpJRErKR_CVLOtU6KFCtlLcGRKUWgmX2TsIRrEdBZa89KGvXy9bc_hyMy8jt1eYxjeqUVAf0sKPDN0sXc4mOAOrEWiNCEjx9KFdfP_hJ0QDseXO258-kgiaNG7hxEuxE_iQf0HmgWPouCCW1GsxqBW3r2ZLICuYUi9eG2y41vUijz9TeyOfIWuyF4yE4Tx8Mdg"
          />
          <StepCard
            title="Continue in chat"
            subtitle="Move into direct negotiation after acceptance"
            step="Step 4"
            icon="chat"
            href="/chat"
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuDVtgU0VjTk_Y2XSUb8-8ohVfbQxtqBxjSjeNw1jqBiyhTBirKjoKoFQoOUC66C2lwOHv1lqf824KOyqyxmh5L6oaf-rTbLMIHCpUJR6lxKSO2O2FVslj-jxsQgnPckNKC9ArFTrO4maJSnlTaQL-XtKHl25Cz2hkPIzpBx1uVFMGU8Tu74tBj_p-0UoZom1buuVWxDl2VzL2B95JL0DbuTs5r1rxm2Gr6bqiMA9KQsN2y9SVLSpp3bhaEi2HK2uY-bPtarCCzVuxY"
          />
        </div>
      </div>
    </section>
  );
}

function StepCard({
  badge,
  title,
  subtitle,
  step,
  icon,
  href,
  image,
}: {
  badge?: string;
  title: string;
  subtitle: string;
  step: string;
  icon: string;
  href: string;
  image: string;
}) {
  return (
    <Link href={href} className="group relative block">
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-100 lg:aspect-none lg:h-80 relative shadow-sm transition-all duration-300 group-hover:shadow-lg">
        {badge ? (
          <span className="absolute top-3 left-3 z-10 rounded bg-white/90 px-2 py-1 text-xs font-bold uppercase tracking-wider text-[#0d1b12]">
            {badge}
          </span>
        ) : null}
        <img
          alt="Request and offer platform step"
          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105 lg:h-full lg:w-full"
          src={image}
        />
        <span className="absolute bottom-4 right-4 translate-y-12 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 bg-primary text-white p-3 rounded-full shadow-lg group-hover:bg-blue-600 group-hover:scale-110">
          <span className="material-symbols-outlined block">{icon}</span>
        </span>
      </div>
      <div className="mt-4 flex justify-between">
        <div>
          <h3 className="text-base font-bold text-[#0d1b12] group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        <p className="text-base font-bold text-primary">{step}</p>
      </div>
    </Link>
  );
}
