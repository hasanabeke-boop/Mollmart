export function CategoriesSection() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0d1b12] sm:text-3xl">
              Shop by Category
            </h2>
            <p className="mt-2 text-gray-500">Explore our most popular departments.</p>
          </div>
          <div className="flex gap-2">
            <button className="h-10 w-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-white transition-colors">
              <span className="material-symbols-outlined text-gray-500">arrow_back</span>
            </button>
            <button className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white hover:bg-[var(--primary-hover)] transition-colors shadow-lg shadow-primary/25">
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <a className="group relative overflow-hidden rounded-2xl h-48 bg-gradient-to-br from-blue-50 to-indigo-100 p-5 flex flex-col justify-end shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1" href="#">
            <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:opacity-20 transition-opacity duration-300">
              <span className="material-symbols-outlined text-[120px] text-primary">devices</span>
            </div>
            <div className="relative z-10">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mb-3 text-primary shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">devices</span>
              </div>
              <h3 className="font-bold text-[#0d1b12] text-lg">Electronics</h3>
              <span className="text-xs text-gray-500 group-hover:text-primary transition-colors flex items-center gap-1 mt-1">
                Browse <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>
          </a>

          <a className="group relative overflow-hidden rounded-2xl h-48 bg-gradient-to-br from-emerald-50 to-teal-100 p-5 flex flex-col justify-end shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1" href="#">
            <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:opacity-20 transition-opacity duration-300">
              <span className="material-symbols-outlined text-[120px] text-emerald-500">chair</span>
            </div>
            <div className="relative z-10">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mb-3 text-emerald-500 shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">chair</span>
              </div>
              <h3 className="font-bold text-[#0d1b12] text-lg">Home &amp; Living</h3>
              <span className="text-xs text-gray-500 group-hover:text-emerald-500 transition-colors flex items-center gap-1 mt-1">
                Browse <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>
          </a>

          <a className="group relative overflow-hidden rounded-2xl h-48 bg-gradient-to-br from-rose-50 to-pink-100 p-5 flex flex-col justify-end shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1" href="#">
            <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:opacity-20 transition-opacity duration-300">
              <span className="material-symbols-outlined text-[120px] text-rose-500">styler</span>
            </div>
            <div className="relative z-10">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mb-3 text-rose-500 shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">styler</span>
              </div>
              <h3 className="font-bold text-[#0d1b12] text-lg">Fashion</h3>
              <span className="text-xs text-gray-500 group-hover:text-rose-500 transition-colors flex items-center gap-1 mt-1">
                Browse <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>
          </a>

          <a className="group relative overflow-hidden rounded-2xl h-48 bg-gradient-to-br from-amber-50 to-orange-100 p-5 flex flex-col justify-end shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1" href="#">
            <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:opacity-20 transition-opacity duration-300">
              <span className="material-symbols-outlined text-[120px] text-amber-500">palette</span>
            </div>
            <div className="relative z-10">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mb-3 text-amber-500 shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">palette</span>
              </div>
              <h3 className="font-bold text-[#0d1b12] text-lg">Art &amp; Collectibles</h3>
              <span className="text-xs text-gray-500 group-hover:text-amber-500 transition-colors flex items-center gap-1 mt-1">
                Browse <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>
          </a>

          <a className="group relative overflow-hidden rounded-2xl h-48 bg-gradient-to-br from-cyan-50 to-sky-100 p-5 flex flex-col justify-end shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1" href="#">
            <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:opacity-20 transition-opacity duration-300">
              <span className="material-symbols-outlined text-[120px] text-cyan-500">sports_basketball</span>
            </div>
            <div className="relative z-10">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mb-3 text-cyan-500 shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">sports_basketball</span>
              </div>
              <h3 className="font-bold text-[#0d1b12] text-lg">Sports</h3>
              <span className="text-xs text-gray-500 group-hover:text-cyan-500 transition-colors flex items-center gap-1 mt-1">
                Browse <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>
          </a>

          <a className="group relative overflow-hidden rounded-2xl h-48 bg-gradient-to-br from-purple-50 to-fuchsia-100 p-5 flex flex-col justify-end shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1" href="#">
            <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:opacity-20 transition-opacity duration-300">
              <span className="material-symbols-outlined text-[120px] text-purple-500">toys</span>
            </div>
            <div className="relative z-10">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mb-3 text-purple-500 shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">toys</span>
              </div>
              <h3 className="font-bold text-[#0d1b12] text-lg">Toys &amp; Hobbies</h3>
              <span className="text-xs text-gray-500 group-hover:text-purple-500 transition-colors flex items-center gap-1 mt-1">
                Browse <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

