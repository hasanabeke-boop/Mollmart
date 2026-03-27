export function DealsSection() {
  return (
    <section className="py-16 bg-[#f8faff]">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-[#0d1b12] sm:text-3xl">
              Deals of the Day
            </h2>
            <div className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
              <span className="material-symbols-outlined text-[16px]">timer</span>
              Ends in 04:23:12
            </div>
          </div>
          <a
            className="text-sm font-bold text-primary hover:text-blue-700 transition-colors flex items-center gap-1 group"
            href="#"
          >
            View all deals
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 group h-full">
            <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-red-500/30">
              -40%
            </div>
            <div className="flex h-full flex-col sm:flex-row">
              <div className="sm:w-1/2 relative h-64 sm:h-auto overflow-hidden">
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 z-10 transition-colors" />
                <img
                  alt="Deal Product"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFFDwtOJW_HASM8LMZsxOjvWdjn8LwopOO0Zgzgn6_PqV-HyfmsTcA5D1Rgb_cR-K8x6yx7IRgJO7rScP4ciLSsFlMPphHgxor7ZWZx6s0nfyrtVho7tKo7iSusqdaBxomj3vppdvZraMGVsDfUaaYkxw_LHO966IzzZedBCl2YGAUVW7N14FIMoJUi0QzRwHwxLX1cJE3hb446ldoCidPZDRpxHadYmwt5uGVBdXLB6xinkpcR9_DLG4cA0vpW6Jhd8HFXN-AOVQ"
                />
              </div>
              <div className="p-6 sm:w-1/2 flex flex-col justify-center">
                <span className="text-xs font-medium text-gray-500 mb-1">Electronics</span>
                <h3 className="text-lg font-bold text-[#0d1b12] mb-2 leading-tight">
                  Pro Wireless Headphones
                </h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-xl font-bold text-primary">$179</span>
                  <span className="text-sm text-gray-400 line-through">$299</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
                  <div className="bg-red-500 h-1.5 rounded-full relative overflow-hidden" style={{ width: "85%" }}>
                    <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-4">85% claimed</p>
                <button className="w-full bg-[#0d1b12] text-white text-sm font-bold py-2 rounded-lg hover:opacity-90 transition-opacity hover:shadow-lg">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 group">
            <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-red-500/30">
              -25%
            </div>
            <div className="aspect-[4/3] w-full overflow-hidden relative">
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 z-10 transition-colors" />
              <img
                alt="Deal Product"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCF5Z737MHdxbZm1ImufTBseKF0b3j-42D8YGWF4902p8S6MTITdvCbczyfnbvWQ-xY52dE1pYE7lpJRErKR_CVLOtU6KFCtlLcGRKUWgmX2TsIRrEdBZa89KGvXy9bc_hyMy8jt1eYxjeqUVAf0sKPDN0sXc4mOAOrEWiNCEjx9KFdfP_hJ0QDseXO258-kgiaNG7hxEuxE_iQf0HmgWPouCCW1GsxqBW3r2ZLICuYUi9eG2y41vUijz9TeyOfIWuyF4yE4Tx8Mdg"
              />
            </div>
            <div className="p-5">
              <h3 className="text-base font-bold text-[#0d1b12] mb-1">Velocity Runner Gen 2</h3>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-primary">$101</span>
                  <span className="text-sm text-gray-400 line-through">$135</span>
                </div>
                <button className="bg-gray-100 p-2 rounded-full text-[#0d1b12] hover:bg-primary hover:text-white transition-colors transform active:scale-95">
                  <span className="material-symbols-outlined text-[20px] block">add_shopping_cart</span>
                </button>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 group">
            <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-red-500/30">
              -15%
            </div>
            <div className="aspect-[4/3] w-full overflow-hidden relative">
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 z-10 transition-colors" />
              <img
                alt="Deal Product"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVtgU0VjTk_Y2XSUb8-8ohVfbQxtqBxjSjeNw1jqBiyhTBirKjoKoFQoOUC66C2lwOHv1lqf824KOyqyxmh5L6oaf-rTbLMIHCpUJR6lxKSO2O2FVslj-jxsQgnPckNKC9ArFTrO4maJSnlTaQL-XtKHl25Cz2hkPIzpBx1uVFMGU8Tu74tBj_p-0UoZom1buuVWxDl2VzL2B95JL0DbuTs5r1rxm2Gr6bqiMA9KQsN2y9SVLSpp3bhaEi2HK2uY-bPtarCCzVuxY"
              />
            </div>
            <div className="p-5">
              <h3 className="text-base font-bold text-[#0d1b12] mb-1">Nordic 3-Seater Sofa</h3>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-primary">$764</span>
                  <span className="text-sm text-gray-400 line-through">$899</span>
                </div>
                <button className="bg-gray-100 p-2 rounded-full text-[#0d1b12] hover:bg-primary hover:text-white transition-colors transform active:scale-95">
                  <span className="material-symbols-outlined text-[20px] block">add_shopping_cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

