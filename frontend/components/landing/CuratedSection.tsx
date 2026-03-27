export function CuratedSection() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0d1b12] sm:text-3xl">
              Curated For You
            </h2>
            <p className="mt-2 text-gray-500">
              Based on your recent interests and browsing history.
            </p>
          </div>
          <a className="hidden sm:block font-bold text-primary hover:text-blue-700 transition-colors" href="#">
            See all items →
          </a>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          <div className="group relative">
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-100 lg:aspect-none lg:h-80 relative shadow-sm transition-all duration-300 group-hover:shadow-lg">
              <span className="absolute top-3 left-3 z-10 rounded bg-white/90 px-2 py-1 text-xs font-bold uppercase tracking-wider text-[#0d1b12]">
                Featured
              </span>
              <button className="absolute top-3 right-3 z-10 rounded-full bg-white/80 p-1.5 text-gray-500 hover:text-red-500 transition-colors hover:scale-110">
                <span className="material-symbols-outlined text-[20px] block">favorite</span>
              </button>
              <img
                alt="Minimalist white watch on simple background"
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105 lg:h-full lg:w-full"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSvMpBvaT1NQnkZbOZBsyn_TmCJAQDAHmpVe8-Zul6hq86scLLD8u91Ut557FP0df0NKLqV3AsHVRh-TassP-XvYM1W4_rIs7NFcVn927a7JMZedVHtT29WgcGm6XaTRjU5RwPfiTsvrKFW-lLBp0XvRZIowozIAHMX5FMvojITW55akC6jLBf4UR-nBKcpujrZ_zZQrD7IW1NRN0YaoLoEnrfx2ykea0bUL5kj5V-GW0lVdpWWRCt59ZRWbnwLyiALu8SGKjB2sY"
              />
              <button className="absolute bottom-4 right-4 translate-y-12 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-blue-600 hover:scale-110 active:scale-95">
                <span className="material-symbols-outlined block">add_shopping_cart</span>
              </button>
            </div>
            <div className="mt-4 flex justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0d1b12] group-hover:text-primary transition-colors">
                  <a href="#">
                    <span aria-hidden="true" className="absolute inset-0" />
                    Minimalist Analog Watch
                  </a>
                </h3>
                <p className="mt-1 text-sm text-gray-500">Accessories</p>
              </div>
              <p className="text-base font-bold text-primary">$145</p>
            </div>
          </div>

          <div className="group relative">
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-100 lg:aspect-none lg:h-80 relative shadow-sm transition-all duration-300 group-hover:shadow-lg">
              <button className="absolute top-3 right-3 z-10 rounded-full bg-white/80 p-1.5 text-gray-500 hover:text-red-500 transition-colors hover:scale-110">
                <span className="material-symbols-outlined text-[20px] block">favorite</span>
              </button>
              <img
                alt="Headphones floating on simple background"
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105 lg:h-full lg:w-full"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFFDwtOJW_HASM8LMZsxOjvWdjn8LwopOO0Zgzgn6_PqV-HyfmsTcA5D1Rgb_cR-K8x6yx7IRgJO7rScP4ciLSsFlMPphHgxor7ZWZx6s0nfyrtVho7tKo7iSusqdaBxomj3vppdvZraMGVsDfUaaYkxw_LHO966IzzZedBCl2YGAUVW7N14FIMoJUi0QzRwHwxLX1cJE3hb446ldoCidPZDRpxHadYmwt5uGVBdXLB6xinkpcR9_DLG4cA0vpW6Jhd8HFXN-AOVQ"
              />
              <button className="absolute bottom-4 right-4 translate-y-12 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-blue-600 hover:scale-110 active:scale-95">
                <span className="material-symbols-outlined block">add_shopping_cart</span>
              </button>
            </div>
            <div className="mt-4 flex justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0d1b12] group-hover:text-primary transition-colors">
                  <a href="#">
                    <span aria-hidden="true" className="absolute inset-0" />
                    X-Pro Wireless Audio
                  </a>
                </h3>
                <p className="mt-1 text-sm text-gray-500">Electronics</p>
              </div>
              <p className="text-base font-bold text-primary">$299</p>
            </div>
          </div>

          <div className="group relative">
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-100 lg:aspect-none lg:h-80 relative shadow-sm transition-all duration-300 group-hover:shadow-lg">
              <button className="absolute top-3 right-3 z-10 rounded-full bg-white/80 p-1.5 text-gray-500 hover:text-red-500 transition-colors hover:scale-110">
                <span className="material-symbols-outlined text-[20px] block">favorite</span>
              </button>
              <img
                alt="Red running shoe on white background"
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105 lg:h-full lg:w-full"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCF5Z737MHdxbZm1ImufTBseKF0b3j-42D8YGWF4902p8S6MTITdvCbczyfnbvWQ-xY52dE1pYE7lpJRErKR_CVLOtU6KFCtlLcGRKUWgmX2TsIRrEdBZa89KGvXy9bc_hyMy8jt1eYxjeqUVAf0sKPDN0sXc4mOAOrEWiNCEjx9KFdfP_hJ0QDseXO258-kgiaNG7hxEuxE_iQf0HmgWPouCCW1GsxqBW3r2ZLICuYUi9eG2y41vUijz9TeyOfIWuyF4yE4Tx8Mdg"
              />
              <button className="absolute bottom-4 right-4 translate-y-12 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-blue-600 hover:scale-110 active:scale-95">
                <span className="material-symbols-outlined block">add_shopping_cart</span>
              </button>
            </div>
            <div className="mt-4 flex justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0d1b12] group-hover:text-primary transition-colors">
                  <a href="#">
                    <span aria-hidden="true" className="absolute inset-0" />
                    Velocity Runner Gen 2
                  </a>
                </h3>
                <p className="mt-1 text-sm text-gray-500">Sports</p>
              </div>
              <p className="text-base font-bold text-primary">$135</p>
            </div>
          </div>

          <div className="group relative">
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-100 lg:aspect-none lg:h-80 relative shadow-sm transition-all duration-300 group-hover:shadow-lg">
              <button className="absolute top-3 right-3 z-10 rounded-full bg-white/80 p-1.5 text-gray-500 hover:text-red-500 transition-colors hover:scale-110">
                <span className="material-symbols-outlined text-[20px] block">favorite</span>
              </button>
              <img
                alt="Modern grey sofa studio shot"
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105 lg:h-full lg:w-full"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVtgU0VjTk_Y2XSUb8-8ohVfbQxtqBxjSjeNw1jqBiyhTBirKjoKoFQoOUC66C2lwOHv1lqf824KOyqyxmh5L6oaf-rTbLMIHCpUJR6lxKSO2O2FVslj-jxsQgnPckNKC9ArFTrO4maJSnlTaQL-XtKHl25Cz2hkPIzpBx1uVFMGU8Tu74tBj_p-0UoZom1buuVWxDl2VzL2B95JL0DbuTs5r1rxm2Gr6bqiMA9KQsN2y9SVLSpp3bhaEi2HK2uY-bPtarCCzVuxY"
              />
              <button className="absolute bottom-4 right-4 translate-y-12 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-blue-600 hover:scale-110 active:scale-95">
                <span className="material-symbols-outlined block">add_shopping_cart</span>
              </button>
            </div>
            <div className="mt-4 flex justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0d1b12] group-hover:text-primary transition-colors">
                  <a href="#">
                    <span aria-hidden="true" className="absolute inset-0" />
                    Nordic 3-Seater Sofa
                  </a>
                </h3>
                <p className="mt-1 text-sm text-gray-500">Home</p>
              </div>
              <p className="text-base font-bold text-primary">$899</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

