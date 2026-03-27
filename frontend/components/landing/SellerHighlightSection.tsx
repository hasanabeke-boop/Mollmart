export function SellerHighlightSection() {
  return (
    <section className="py-16 bg-[#0f1323] relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5" />
      <div className="absolute -top-64 -left-64 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px]" />

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="lg:w-1/3 flex flex-col gap-6 text-center lg:text-left">
            <div className="inline-flex items-center justify-center lg:justify-start gap-2 text-primary font-bold uppercase tracking-wide text-xs">
              <span className="material-symbols-outlined text-sm">star</span>
              Seller of the Month
            </div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Meet CraftyMinds</h2>
            <p className="text-gray-300">
              &quot;We believe in the beauty of handmade imperfection. Every piece tells a story of sustainable
              crafting and modern design.&quot;
            </p>
            <div className="flex items-center justify-center lg:justify-start gap-4">
              <img
                alt="Seller Avatar"
                className="w-16 h-16 rounded-full border-2 border-primary object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSvMpBvaT1NQnkZbOZBsyn_TmCJAQDAHmpVe8-Zul6hq86scLLD8u91Ut557FP0df0NKLqV3AsHVRh-TassP-XvYM1W4_rIs7NFcVn927a7JMZedVHtT29WgcGm6XaTRjU5RwPfiTsvrKFW-lLBp0XvRZIowozIAHMX5FMvojITW55akC6jLBf4UR-nBKcpujrZ_zZQrD7IW1NRN0YaoLoEnrfx2ykea0bUL5kj5V-GW0lVdpWWRCt59ZRWbnwLyiALu8SGKjB2sY"
              />
              <div className="text-left">
                <div className="text-white font-bold">Sarah Jenkins</div>
                <div className="text-gray-400 text-sm">Founder, CraftyMinds</div>
                <div className="flex text-yellow-400 text-sm mt-1">
                  <span className="material-symbols-outlined text-[16px] fill-current">star</span>
                  <span className="material-symbols-outlined text-[16px] fill-current">star</span>
                  <span className="material-symbols-outlined text-[16px] fill-current">star</span>
                  <span className="material-symbols-outlined text-[16px] fill-current">star</span>
                  <span className="material-symbols-outlined text-[16px] fill-current">star_half</span>
                  <span className="ml-1 text-gray-400">(4.8)</span>
                </div>
              </div>
            </div>
            <div className="pt-4">
              <button className="bg-primary hover:bg-[var(--primary-hover)] text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-primary/30 transition-all hover:scale-105">
                Visit Shop
              </button>
            </div>
          </div>

          <div className="lg:w-2/3 w-full grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="group relative rounded-xl overflow-hidden aspect-square cursor-pointer">
              <img
                alt="Product 1"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVtgU0VjTk_Y2XSUb8-8ohVfbQxtqBxjSjeNw1jqBiyhTBirKjoKoFQoOUC66C2lwOHv1lqf824KOyqyxmh5L6oaf-rTbLMIHCpUJR6lxKSO2O2FVslj-jxsQgnPckNKC9ArFTrO4maJSnlTaQL-XtKHl25Cz2hkPIzpBx1uVFMGU8Tu74tBj_p-0UoZom1buuVWxDl2VzL2B95JL0DbuTs5r1rxm2Gr6bqiMA9KQsN2y9SVLSpp3bhaEi2HK2uY-bPtarCCzVuxY"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-bold">View Item</span>
              </div>
            </div>

            <div className="group relative rounded-xl overflow-hidden aspect-square cursor-pointer md:mt-8">
              <img
                alt="Product 2"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSvMpBvaT1NQnkZbOZBsyn_TmCJAQDAHmpVe8-Zul6hq86scLLD8u91Ut557FP0df0NKLqV3AsHVRh-TassP-XvYM1W4_rIs7NFcVn927a7JMZedVHtT29WgcGm6XaTRjU5RwPfiTsvrKFW-lLBp0XvRZIowozIAHMX5FMvojITW55akC6jLBf4UR-nBKcpujrZ_zZQrD7IW1NRN0YaoLoEnrfx2ykea0bUL5kj5V-GW0lVdpWWRCt59ZRWbnwLyiALu8SGKjB2sY"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-bold">View Item</span>
              </div>
            </div>

            <div className="group relative rounded-xl overflow-hidden aspect-square cursor-pointer">
              <img
                alt="Product 3"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFFDwtOJW_HASM8LMZsxOjvWdjn8LwopOO0Zgzgn6_PqV-HyfmsTcA5D1Rgb_cR-K8x6yx7IRgJO7rScP4ciLSsFlMPphHgxor7ZWZx6s0nfyrtVho7tKo7iSusqdaBxomj3vppdvZraMGVsDfUaaYkxw_LHO966IzzZedBCl2YGAUVW7N14FIMoJUi0QzRwHwxLX1cJE3hb446ldoCidPZDRpxHadYmwt5uGVBdXLB6xinkpcR9_DLG4cA0vpW6Jhd8HFXN-AOVQ"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-bold">View Item</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

