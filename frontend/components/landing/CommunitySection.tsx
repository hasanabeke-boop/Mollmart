export function CommunitySection() {
  return (
    <section className="py-16 bg-[#eff6ff]">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
            Community
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-[#0d1b12] sm:text-4xl">
            Community Picks
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Collections curated by our top sellers and power buyers. Find hidden gems and niche favorites.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <div className="relative h-96 w-full overflow-hidden">
              <img
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-75 group-hover:brightness-90"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVtgU0VjTk_Y2XSUb8-8ohVfbQxtqBxjSjeNw1jqBiyhTBirKjoKoFQoOUC66C2lwOHv1lqf824KOyqyxmh5L6oaf-rTbLMIHCpUJR6lxKSO2O2FVslj-jxsQgnPckNKC9ArFTrO4maJSnlTaQL-XtKHl25Cz2hkPIzpBx1uVFMGU8Tu74tBj_p-0UoZom1buuVWxDl2VzL2B95JL0DbuTs5r1rxm2Gr6bqiMA9KQsN2y9SVLSpp3bhaEi2HK2uY-bPtarCCzVuxY"
                alt="Minimalist Home collection"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 w-full translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    className="h-8 w-8 rounded-full border border-white"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDD5u2P0h5u6cmJ3VrwM_YTExrsxYvwQuhUuC20UzPPiyPDpUeGjoIbqtImSrQDrvMGulVnDYs8kjYqFyEqJBzhwDUhKYH4QRwou_bs1qgbfE2upftaoJB1Pbho3uka0PvoMD8fXEz7TSCwi-14E8lSBmRLvlXerjW4razbiB0LU1GyrvkEWvYzHi2slaoScbTpgpt9AeQEszRnV1cDbZNSA8ijt8DaTdoemK8kqoOH9YDz8fTqY7KRDiJGnPWCXc3P6sy5RNTkpkc"
                    alt="Curator avatar"
                  />
                  <span className="text-white text-sm font-medium">Curated by Sarah</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">Minimalist Home</h3>
                <p className="text-gray-300 text-sm">24 items • Clean lines &amp; neutral tones</p>
              </div>
            </div>
          </div>

          <div className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <div className="relative h-96 w-full overflow-hidden">
              <img
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-75 group-hover:brightness-90"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDD5u2P0h5u6cmJ3VrwM_YTExrsxYvwQuhUuC20UzPPiyPDpUeGjoIbqtImSrQDrvMGulVnDYs8kjYqFyEqJBzhwDUhKYH4QRwou_bs1qgbfE2upftaoJB1Pbho3uka0PvoMD8fXEz7TSCwi-14E8lSBmRLvlXerjW4razbiB0LU1GyrvkEWvYzHi2slaoScbTpgpt9AeQEszRnV1cDbZNSA8ijt8DaTdoemK8kqoOH9YDz8fTqY7KRDiJGnPWCXc3P6sy5RNTkpkc"
                alt="WFH Essentials collection"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 w-full translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    className="h-8 w-8 rounded-full border border-white"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFFDwtOJW_HASM8LMZsxOjvWdjn8LwopOO0Zgzgn6_PqV-HyfmsTcA5D1Rgb_cR-K8x6yx7IRgJO7rScP4ciLSsFlMPphHgxor7ZWZx6s0nfyrtVho7tKo7iSusqdaBxomj3vppdvZraMGVsDfUaaYkxw_LHO966IzzZedBCl2YGAUVW7N14FIMoJUi0QzRwHwxLX1cJE3hb446ldoCidPZDRpxHadYmwt5uGVBdXLB6xinkpcR9_DLG4cA0vpW6Jhd8HFXN-AOVQ"
                    alt="Curator avatar"
                  />
                  <span className="text-white text-sm font-medium">Curated by TechHub</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">WFH Essentials</h3>
                <p className="text-gray-300 text-sm">18 items • Productivity boosters</p>
              </div>
            </div>
          </div>

          <div className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <div className="relative h-96 w-full overflow-hidden">
              <img
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-75 group-hover:brightness-90"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCF5Z737MHdxbZm1ImufTBseKF0b3j-42D8YGWF4902p8S6MTITdvCbczyfnbvWQ-xY52dE1pYE7lpJRErKR_CVLOtU6KFCtlLcGRKUWgmX2TsIRrEdBZa89KGvXy9bc_hyMy8jt1eYxjeqUVAf0sKPDN0sXc4mOAOrEWiNCEjx9KFdfP_hJ0QDseXO258-kgiaNG7hxEuxE_iQf0HmgWPouCCW1GsxqBW3r2ZLICuYUi9eG2y41vUijz9TeyOfIWuyF4yE4Tx8Mdg"
                alt="Urban Athlete collection"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 w-full translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    className="h-8 w-8 rounded-full border border-white"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSvMpBvaT1NQnkZbOZBsyn_TmCJAQDAHmpVe8-Zul6hq86scLLD8u91Ut557FP0df0NKLqV3AsHVRh-TassP-XvYM1W4_rIs7NFcVn927a7JMZedVHtT29WgcGm6XaTRjU5RwPfiTsvrKFW-lLBp0XvRZIowozIAHMX5FMvojITW55akC6jLBf4UR-nBKcpujrZ_zZQrD7IW1NRN0YaoLoEnrfx2ykea0bUL5kj5V-GW0lVdpWWRCt59ZRWbnwLyiALu8SGKjB2sY"
                    alt="Curator avatar"
                  />
                  <span className="text-white text-sm font-medium">Curated by RunClub</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">Urban Athlete</h3>
                <p className="text-gray-300 text-sm">32 items • Gear for the city</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

