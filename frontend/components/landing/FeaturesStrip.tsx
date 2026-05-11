export function FeaturesStrip() {
  return (
    <section className="py-10 bg-white">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <a className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors" href="#">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">ads_click</span>
            </div>
            <div>
              <h3 className="font-bold text-[#0d1b12]">Qualified Demand</h3>
              <p className="text-xs text-gray-500">Real buyer intent</p>
            </div>
          </a>

          <a className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors" href="#">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">match_case</span>
            </div>
            <div>
              <h3 className="font-bold text-[#0d1b12]">Seller Matching</h3>
              <p className="text-xs text-gray-500">Category-based discovery</p>
            </div>
          </a>

          <a className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors" href="#">
            <div className="h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">forum</span>
            </div>
            <div>
              <h3 className="font-bold text-[#0d1b12]">Negotiation Chat</h3>
              <p className="text-xs text-gray-500">Talk after acceptance</p>
            </div>
          </a>

          <a className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors" href="#">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">verified</span>
            </div>
            <div>
              <h3 className="font-bold text-[#0d1b12]">Verified Profiles</h3>
              <p className="text-xs text-gray-500">Trust and moderation</p>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

