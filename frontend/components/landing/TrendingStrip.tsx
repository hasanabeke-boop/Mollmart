export function TrendingStrip() {
  return (
    <section className="border-y border-gray-100 bg-white py-4 overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 flex items-center gap-6">
        <span className="flex items-center gap-2 text-sm font-bold text-[#0d1b12] whitespace-nowrap shrink-0">
          <span className="material-symbols-outlined text-primary">manage_search</span>
          Trending:
        </span>

        <div className="flex-1 overflow-x-auto no-scrollbar mask-linear-fade">
          <div className="flex gap-3 min-w-max pb-1 sm:pb-0">
            <a className="px-4 py-1.5 rounded-full bg-gray-100 text-sm font-medium text-gray-600 hover:bg-primary hover:text-white transition-colors" href="#">
              Vintage Cameras
            </a>
            <a className="px-4 py-1.5 rounded-full bg-gray-100 text-sm font-medium text-gray-600 hover:bg-primary hover:text-white transition-colors" href="#">
              Mechanical Keyboards
            </a>
            <a className="px-4 py-1.5 rounded-full bg-red-50 text-sm font-medium text-red-600 border border-red-100 hover:bg-red-100 transition-colors flex items-center gap-1" href="#">
              <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
              Hot Deals
            </a>
            <a className="px-4 py-1.5 rounded-full bg-gray-100 text-sm font-medium text-gray-600 hover:bg-primary hover:text-white transition-colors" href="#">
              Smart Home
            </a>
            <a className="px-4 py-1.5 rounded-full bg-gray-100 text-sm font-medium text-gray-600 hover:bg-primary hover:text-white transition-colors" href="#">
              Sustainable Fashion
            </a>
            <a className="px-4 py-1.5 rounded-full bg-gray-100 text-sm font-medium text-gray-600 hover:bg-primary hover:text-white transition-colors" href="#">
              Rare Vinyls
            </a>
            <a className="px-4 py-1.5 rounded-full bg-gray-100 text-sm font-medium text-gray-600 hover:bg-primary hover:text-white transition-colors" href="#">
              Gaming Laptops
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

