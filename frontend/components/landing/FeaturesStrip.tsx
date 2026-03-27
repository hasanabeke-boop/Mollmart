export function FeaturesStrip() {
  return (
    <section className="py-10 bg-white">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <a className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors" href="#">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">recycling</span>
            </div>
            <div>
              <h3 className="font-bold text-[#0d1b12]">Eco-Friendly</h3>
              <p className="text-xs text-gray-500">Sustainable choices</p>
            </div>
          </a>

          <a className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors" href="#">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">handyman</span>
            </div>
            <div>
              <h3 className="font-bold text-[#0d1b12]">Handmade</h3>
              <p className="text-xs text-gray-500">Unique treasures</p>
            </div>
          </a>

          <a className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors" href="#">
            <div className="h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">local_shipping</span>
            </div>
            <div>
              <h3 className="font-bold text-[#0d1b12]">Fast Shipping</h3>
              <p className="text-xs text-gray-500">Tracked &amp; Insured</p>
            </div>
          </a>

          <a className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors" href="#">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">verified</span>
            </div>
            <div>
              <h3 className="font-bold text-[#0d1b12]">Authentic</h3>
              <p className="text-xs text-gray-500">Quality verified</p>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

