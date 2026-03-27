export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="flex flex-col items-start gap-6 z-10 animate-[fadeIn_1s_ease-out]">
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-sm">
              <span className="mr-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
              New: Community Curated Collections
            </div>

            <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-[#0d1b12] sm:text-6xl lg:text-7xl">
              Marketplace <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 animate-[gradient_3s_infinite]">
                Reimagined.
              </span>
            </h1>

            <p className="max-w-xl text-lg text-gray-600">
              Discover personalized recommendations, eco-friendly finds, and join a community of demand-driven listings.
              The marketplace that knows exactly what you need.
            </p>

            <div className="flex flex-col w-full sm:flex-row gap-3 sm:w-auto mt-4">
              <button className="flex items-center justify-center rounded-lg bg-primary h-14 px-8 text-base font-bold text-white transition-all hover:bg-[var(--primary-hover)] shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1">
                Start Exploring
              </button>
              <button className="flex items-center justify-center rounded-lg bg-white border border-gray-200 h-14 px-8 text-base font-bold text-[#0d1b12] hover:bg-gray-50 transition-colors hover:border-gray-300">
                Browse Sellers
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm font-medium text-gray-500">
              <div className="flex items-center gap-2 hover:text-primary transition-colors cursor-default">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                Verified Sellers
              </div>
              <div className="flex items-center gap-2 hover:text-primary transition-colors cursor-default">
                <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
                Buyer Protection
              </div>
              <div className="flex items-center gap-2 hover:text-primary transition-colors cursor-default">
                <span className="material-symbols-outlined text-primary text-[20px]">eco</span>
                Eco-Conscious
              </div>
            </div>
          </div>

          <div className="relative lg:h-full w-full perspective-[1000px]">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/10 group transform transition-transform duration-500 hover:rotate-y-2">
              <div className="absolute inset-0 bg-black/10 z-10 group-hover:bg-black/0 transition-colors duration-500" />
              <img
                alt="Lifestyle shot of diverse people enjoying sustainable products"
                className="h-full w-full object-cover transition-transform duration-[20s] ease-linear scale-100 group-hover:scale-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDD5u2P0h5u6cmJ3VrwM_YTExrsxYvwQuhUuC20UzPPiyPDpUeGjoIbqtImSrQDrvMGulVnDYs8kjYqFyEqJBzhwDUhKYH4QRwou_bs1qgbfE2upftaoJB1Pbho3uka0PvoMD8fXEz7TSCwi-14E8lSBmRLvlXerjW4razbiB0LU1GyrvkEWvYzHi2slaoScbTpgpt9AeQEszRnV1cDbZNSA8ijt8DaTdoemK8kqoOH9YDz8fTqY7KRDiJGnPWCXc3P6sy5RNTkpkc"
              />

              <div className="absolute top-8 left-8 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/20 z-20 max-w-[240px] animate-[bounce_3s_infinite] cursor-pointer hover:scale-105 transition-transform">
                <div className="flex gap-3 items-center">
                  <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-primary">
                    <img
                      alt="User avatar"
                      className="h-full w-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSvMpBvaT1NQnkZbOZBsyn_TmCJAQDAHmpVe8-Zul6hq86scLLD8u91Ut557FP0df0NKLqV3AsHVRh-TassP-XvYM1W4_rIs7NFcVn927a7JMZedVHtT29WgcGm6XaTRjU5RwPfiTsvrKFW-lLBp0XvRZIowozIAHMX5FMvojITW55akC6jLBf4UR-nBKcpujrZ_zZQrD7IW1NRN0YaoLoEnrfx2ykea0bUL5kj5V-GW0lVdpWWRCt59ZRWbnwLyiALu8SGKjB2sY"
                    />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">Seller Story</div>
                    <div className="font-bold text-sm leading-tight">"Turning vintage into vogue."</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 right-8 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/20 z-20 w-[280px] hover:translate-y-[-5px] transition-transform duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                    Trending Now
                  </div>
                  <span className="material-symbols-outlined text-primary text-sm">trending_up</span>
                </div>

                <div className="flex gap-3 items-center">
                  <div
                    className="h-14 w-14 rounded-lg bg-gray-100 bg-cover bg-center shrink-0 shadow-md"
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA13zceiKOOHsk5AOPVqO1hFJB3sn83SV_pSVHkF35b2fDIfMxuDpkHWPr6jEMz5Uu3EZRYw_K7iwItT_BOQS-KSQzeeXapwvuVlVoHwgE6ubshiJyQjnl1LeXbOl6gskz6yM9ixmo7W_UFuVfNjJh7Rbv_-lQI4HAARCU3FrAgLwqrIzkzJrLW3JBr-jDhvMa_yqw5cx4ADnX1F8pHeeO0cySUsZvwbjnyXUDSFS3xMRLKiscFlnwor6V3hQ6JemkV3FbZzWLWdh0')",
                    }}
                  />
                  <div>
                    <div className="font-bold text-sm line-clamp-1">Premium Noise Cancellation</div>
                    <div className="text-xs text-gray-500 mt-1">142 people viewing</div>
                  </div>
                  <button className="ml-auto bg-primary/10 text-primary p-2 rounded-full hover:bg-primary hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[18px] block">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

