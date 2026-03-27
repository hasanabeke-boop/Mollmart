export function DemandSection() {
  return (
    <section className="py-16 bg-white border-y border-gray-100">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-[#0d1b12] sm:text-3xl">
              Demand-Driven Trending
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              Don&apos;t guess what to sell. See exactly what buyers are searching for right now.
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <button
              className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0d1b12] shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
              type="button"
            >
              View All Demands
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col rounded-xl bg-[#f8faff] p-6 shadow-sm border border-gray-100 hover:border-primary/50 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                  <span className="material-symbols-outlined">camera_alt</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#0d1b12]">Vintage Film Cameras</h3>
                  <p className="text-xs text-gray-500">Collectibles</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                High Demand
              </span>
            </div>
            <div className="mt-4 flex-1">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">Active Buyers</span>
                <span className="font-bold text-[#0d1b12]">1,240</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div className="h-2 rounded-full bg-red-500 animate-[width_1s_ease-out]" style={{ width: "85%" }} />
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Looking for Canon AE-1 and similar models in working condition.
              </p>
            </div>
            <button className="mt-6 w-full rounded-lg bg-white border border-gray-200 px-4 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-white hover:border-primary transition-all">
              I have one to sell
            </button>
          </div>

          <div className="flex flex-col rounded-xl bg-[#f8faff] p-6 shadow-sm border border-gray-100 hover:border-primary/50 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                  <span className="material-symbols-outlined">potted_plant</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#0d1b12]">Rare Monsteras</h3>
                  <p className="text-xs text-gray-500">Home &amp; Garden</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/10">
                Rising
              </span>
            </div>
            <div className="mt-4 flex-1">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">Active Buyers</span>
                <span className="font-bold text-[#0d1b12]">856</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div className="h-2 rounded-full bg-orange-500 animate-[width_1s_ease-out]" style={{ width: "65%" }} />
              </div>
              <p className="mt-4 text-sm text-gray-600">
                High interest in variegated Monstera cuttings and established plants.
              </p>
            </div>
            <button className="mt-6 w-full rounded-lg bg-white border border-gray-200 px-4 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-white hover:border-primary transition-all">
              I have one to sell
            </button>
          </div>

          <div className="flex flex-col rounded-xl bg-[#f8faff] p-6 shadow-sm border border-gray-100 hover:border-primary/50 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                  <span className="material-symbols-outlined">videogame_asset</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#0d1b12]">Retro Consoles</h3>
                  <p className="text-xs text-gray-500">Electronics</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                Steady
              </span>
            </div>
            <div className="mt-4 flex-1">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">Active Buyers</span>
                <span className="font-bold text-[#0d1b12]">2,100+</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div className="h-2 rounded-full bg-primary animate-[width_1s_ease-out]" style={{ width: "90%" }} />
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Constant demand for N64, GameCube, and PS2 consoles.
              </p>
            </div>
            <button className="mt-6 w-full rounded-lg bg-white border border-gray-200 px-4 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-white hover:border-primary transition-all">
              I have one to sell
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

