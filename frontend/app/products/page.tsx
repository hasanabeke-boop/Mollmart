'use client';

import Link from "next/link";
import { useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  description: string;
  image: string;
  price: number;
  oldPrice?: number;
  demandBadge?: "high" | "trending";
  priceLabel: "asking" | "starting";
  rating: number;
};

const ALL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Sony WH-1000XM4",
    description: "Industry Leading Noise Canceling",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCyo2okiSPlqsE8Y5oEuaEbTRbo_eGVW4a5lFOV77lodB2hWClamzZ1oWgYHEr7GBDge-n-k_ETRGk9iqf6apdOopHtrNyBWEbhq1KZielKqqWOEmK6RMSsvaDeaPwriJBSI5XnSmhw91za26jjsGW05gDHpO8W8rG0DBTwqpiMVh8oawOdeF42PTlTdEWQ42YgKY5zuly6He8IBXeZMmR24thwj1Ym7H2M6ie3i8wLzUBFz-CTkGsvL7DDlBDmuPclTuJYnuP-jhk",
    price: 348,
    oldPrice: 399,
    demandBadge: "high",
    priceLabel: "asking",
    rating: 4.8,
  },
  {
    id: 2,
    name: "Beats Studio3 Wireless",
    description: "High-performance wireless noise cancelling",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBY0cmsxPrNYDV-GGGSgc5-knkxMfdRHRb4Pz3MuX4YCEjSzYU7mbGxkqhPHcBwE0ELsVYdySztZWkAKHQmSkgZynaZ52wh6Mw3OIZ2iiV8UbjpqgxCm1eA0uFxVbxxXzDv2wOSA80cTKuWsfXho7lfXaXGpLbXvzlLwhM0D4bajhoY0MGfJo4xnRQCBgctPFbfWSD1xGWO3SCJXcOw1Oli0ZbXwYyhT4XCqsxJt5_6xZpJK2-etUnhsnW4Wrcrnhc34JN85nMa8HQ",
    price: 199.99,
    priceLabel: "starting",
    demandBadge: "trending",
    rating: 4.2,
  },
  {
    id: 3,
    name: "Apple AirPods Pro (2nd Gen)",
    description: "Rich audio, next-level active noise cancellation",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBhM1vij9Xh1AsO3jK-aPrY9rfzoXWEzMKV53diTJiEoc1NoU2GmMrU-M5-QoFvI21PQKbdanWL0W5igN6D57UPkBi8Ts4DaT17L2h0aqs0Dnfap6R9tw3FsNS19sXH8s2ZMKntN6K-G-45fANnqDllL2pK7aNs0Emkg1Wd6JUpC1NyL8iziomWOY90skg6zFXqR-QqkhYNC1eh9xHH335eBJyVGVaB8BWI_Ei_IEil3ErgzV0p3RyV6w6kO-g3IVlb0JNwjLi84yI",
    price: 249,
    priceLabel: "asking",
    demandBadge: "high",
    rating: 4.9,
  },
  {
    id: 4,
    name: "HyperX Cloud II",
    description: "Gaming Headset, 7.1 Surround Sound",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAWnjzHKNRJVpsPm9DNAvfo5F-RJ0DQ6MNzI831oPiDO1BPjQ4nJS3TejG7Foq55GsP67NHZAUoEJyqrxvN_CphLC3lAF7WqZ5fWg1V0AN_TSCcYQZphw8_Ck96HD_3og_2f9PTO83H6CAzE3FWw1t5iW7lWexGCjq_1B78kl9VbX_YfX2afgrYZiUQysCIa-E1aL_ciIL6yQnhXKvWvDWJsSN9YOe12TisxJuht41ajgSBbYTzIouzeFzPUZv6PiAgCBhRcPtyJ8A",
    price: 79.99,
    oldPrice: 99.99,
    priceLabel: "starting",
    rating: 4.6,
  },
  {
    id: 5,
    name: "Sennheiser Momentum 4",
    description: "Wireless Headphones with Adaptive Noise Cancellation",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDYFgQvNIRYHCJ4UylGmVnU9FEkotXChi-PJ680Q05dj_fHvHrLWZEMEF6MH40N6uLBpI0KeRzGMFJkuOd00sTl6mDukFkfJIa8Og7yNUGnPtoiGA5XnuxvJm_Evkk6-6qcXmZ7L2XbT_Gr_tuVZJkwadGK7MotG4tr62bvg5GEX106PtSg39q3Z0uP-RLQAcEE0XVzMfI4MoCtZdrFqcZOdSspgPXxw6JjzD0F3Sqh5bJbpZIoefin2ImACfZp9vDegkAhPftNyFI",
    price: 299.95,
    priceLabel: "asking",
    demandBadge: "high",
    rating: 4.5,
  },
  {
    id: 6,
    name: "Sony LinkBuds S",
    description: "Truly Wireless Noise Canceling Earbuds",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCDu0eTZlrK0YS9kUBa2KQnlecGb8POC2llGTp4dcNjspuVGsWHJgG7Bs9QKLsHyt0tVgii4CcguziYUjTWraqkiohARDt6O2aCVJ6z1t1IvIwJPpESvZKs9CcoTPuSzpGnDLFB-eI8TkIcfphaFPn9TJ_4zD2EBimbU8qsou7AfwoFBMPAkOeeBQpJF-PT2Pm9AdUmaAkTKXVf2KLW8iSAizzq-L0c96dx1T1spEI4TJSwPo7TXS7Fiemh7tWEmwNnqfnIDq11mjU",
    price: 148,
    oldPrice: 199.99,
    priceLabel: "starting",
    rating: 4.3,
  },
];

const RANGE_MIN = 0;
const RANGE_MAX = 500;

export default function ProductsPage() {
  const [minPrice, setMinPrice] = useState(50);
  const [maxPrice, setMaxPrice] = useState(500);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const clampedMin = Math.min(Math.max(minPrice, RANGE_MIN), maxPrice);
  const clampedMax = Math.max(Math.min(maxPrice, RANGE_MAX), clampedMin);

  const filteredProducts = useMemo(
    () =>
      ALL_PRODUCTS.filter(
        (product) => product.price >= clampedMin && product.price <= clampedMax,
      ),
    [clampedMin, clampedMax],
  );

  const minPercent = ((clampedMin - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100;
  const maxPercent = ((clampedMax - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex mb-4">
        <ol className="flex items-center space-x-2">
          <li>
            <Link
              href="/"
              className="text-slate-500 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-xl">home</span>
            </Link>
          </li>
          <li>
            <span className="text-slate-400">/</span>
          </li>
          <li>
            <a
              href="#"
              className="text-sm font-medium text-slate-500 hover:text-primary transition-colors"
            >
              Electronics
            </a>
          </li>
          <li>
            <span className="text-slate-400">/</span>
          </li>
          <li>
            <span aria-current="page" className="text-sm font-medium text-primary">
              Audio
            </span>
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Wireless Headphones
        </h1>
        <p className="mt-2 text-base text-slate-500">
          Premium sound quality with noise cancellation features.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0 space-y-8">
          {/* Mobile Filter Button */}
          <button className="lg:hidden flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold shadow-sm">
            <span className="material-symbols-outlined">filter_list</span>
            Filters &amp; Sorting
          </button>

          {/* Desktop Filters */}
          <div className="hidden lg:block space-y-8">
            {/* Categories */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Category
              </h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    defaultChecked
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary bg-slate-50"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">
                    Over-Ear
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary bg-slate-50"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">
                    In-Ear (Earbuds)
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary bg-slate-50"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">
                    Noise Cancelling
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary bg-slate-50"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">
                    Gaming Headsets
                  </span>
                </label>
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Price Range
                </h3>
                <span className="text-xs font-medium text-slate-500">
                  ${clampedMin} - ${clampedMax}
                </span>
              </div>
              <div className="relative h-6 w-full">
                <input
                  type="range"
                  min={RANGE_MIN}
                  max={RANGE_MAX}
                  value={clampedMin}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setMinPrice(Math.min(value, clampedMax));
                  }}
                  className="absolute w-full z-20 cursor-pointer h-2 opacity-0"
                />
                <input
                  type="range"
                  min={RANGE_MIN}
                  max={RANGE_MAX}
                  value={clampedMax}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setMaxPrice(Math.max(value, clampedMin));
                  }}
                  className="absolute w-full z-20 cursor-pointer h-2 opacity-0"
                />
                <div className="absolute top-1 left-0 w-full h-1 bg-slate-200 rounded-full" />
                <div
                  className="absolute top-1 h-1 bg-primary rounded-full"
                  style={{
                    left: `${minPercent}%`,
                    right: `${100 - maxPercent}%`,
                  }}
                />
                <div
                  className="absolute top-0 h-3 w-3 bg-white border-2 border-primary rounded-full shadow cursor-pointer"
                  style={{ left: `calc(${minPercent}% - 6px)` }}
                />
                <div
                  className="absolute top-0 h-3 w-3 bg-white border-2 border-primary rounded-full shadow cursor-pointer"
                  style={{ left: `calc(${maxPercent}% - 6px)` }}
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-slate-500 text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    value={clampedMin}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (Number.isNaN(value)) return;
                      setMinPrice(Math.min(Math.max(value, RANGE_MIN), clampedMax));
                    }}
                    className="block w-full rounded-md border-slate-200 bg-white py-1.5 pl-5 text-sm shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>
                <span className="text-slate-400">-</span>
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-slate-500 text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    value={clampedMax}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (Number.isNaN(value)) return;
                      setMaxPrice(Math.max(Math.min(value, RANGE_MAX), clampedMin));
                    }}
                    className="block w-full rounded-md border-slate-200 bg-white py-1.5 pl-5 text-sm shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Rating
              </h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="rating"
                    className="h-4 w-4 border-slate-300 text-primary focus:ring-primary bg-slate-50"
                  />
                  <div className="flex items-center text-yellow-400 text-lg">
                    <span className="material-symbols-outlined filled text-[20px]">star</span>
                    <span className="material-symbols-outlined filled text-[20px]">star</span>
                    <span className="material-symbols-outlined filled text-[20px]">star</span>
                    <span className="material-symbols-outlined filled text-[20px]">star</span>
                    <span className="material-symbols-outlined text-[20px]">star</span>
                  </div>
                  <span className="text-sm text-slate-600">&amp; Up</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="rating"
                    className="h-4 w-4 border-slate-300 text-primary focus:ring-primary bg-slate-50"
                  />
                  <div className="flex items-center text-yellow-400 text-lg">
                    <span className="material-symbols-outlined filled text-[20px]">star</span>
                    <span className="material-symbols-outlined filled text-[20px]">star</span>
                    <span className="material-symbols-outlined filled text-[20px]">star</span>
                    <span className="material-symbols-outlined text-[20px]">star</span>
                    <span className="material-symbols-outlined text-[20px]">star</span>
                  </div>
                  <span className="text-sm text-slate-600">&amp; Up</span>
                </label>
              </div>
            </div>

            {/* Brands */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Brands
              </h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    defaultChecked
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary bg-slate-50"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">
                    Sony
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary bg-slate-50"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">
                    Bose
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary bg-slate-50"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">
                    Sennheiser
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary bg-slate-50"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">
                    Apple
                  </span>
                </label>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Product Grid */}
        <main className="flex-1">
          {/* Sorting Toolbar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-3 shadow-sm border border-slate-100">
            <p className="pl-2 text-sm text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-900">
                {filteredProducts.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-900">
                {ALL_PRODUCTS.length}
              </span>{" "}
              results
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-slate-500 mr-1">Sort by:</span>
              <div className="relative">
                <select className="cursor-pointer appearance-none rounded-lg border-0 bg-[#f5f6f8] py-1.5 pl-3 pr-8 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6">
                  <option>Recommended</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest Arrivals</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors ${
                  viewMode === "grid" ? "bg-slate-100 text-slate-900" : ""
                }`}
                aria-pressed={viewMode === "grid"}
              >
                <span className="material-symbols-outlined filled">grid_view</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors ${
                  viewMode === "list" ? "bg-slate-100 text-slate-900" : ""
                }`}
                aria-pressed={viewMode === "list"}
              >
                <span className="material-symbols-outlined">view_list</span>
              </button>
            </div>
          </div>

          {/* Product Grid */}
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {filteredProducts.map((product) => {
              const isHighDemand = product.demandBadge === "high";
              const isTrending = product.demandBadge === "trending";

              return (
                <div
                  key={product.id}
                  className={`group relative overflow-hidden rounded-xl bg-white shadow-sm border border-slate-100 transition-all hover:-translate-y-1 hover:shadow-md ${
                    viewMode === "list" ? "flex flex-col sm:flex-row" : "flex flex-col"
                  }`}
                >
                  <div
                    className={`relative overflow-hidden bg-gray-100 ${
                      viewMode === "list"
                        ? "w-full sm:w-64 aspect-[4/3] flex-shrink-0"
                        : "w-full aspect-[4/3]"
                    }`}
                  >
                    <div className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-1.5 backdrop-blur-sm transition-colors hover:bg-primary hover:text-white cursor-pointer group/fav">
                      <span className="material-symbols-outlined text-[20px] transition-colors group-hover/fav:text-slate-900 text-slate-400">
                        favorite
                      </span>
                    </div>
                    <img
                      alt={product.name}
                      className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                      src={product.image}
                    />
                    {isHighDemand && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-bold text-slate-900 backdrop-blur-md shadow-sm">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        High Demand
                      </div>
                    )}
                    {isTrending && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md shadow-sm">
                        <span className="material-symbols-outlined text-[14px]">
                          local_fire_department
                        </span>
                        Trending
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md shadow-sm">
                      <span className="material-symbols-outlined text-[12px] filled">gavel</span>
                      Biddable
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-2">
                      <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-1">
                        {product.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex text-yellow-400">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <span
                            key={index}
                            className={`material-symbols-outlined text-[16px]${
                              index < Math.round(product.rating) ? " filled" : ""
                            }`}
                          >
                            star
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-medium text-slate-500 ml-1">
                        ({product.rating.toFixed(1)})
                      </span>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-slate-900">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-0.5">
                            {product.priceLabel === "asking" ? "Asking Price" : "Starting from"}
                          </span>
                          ${product.price.toFixed(2)}
                        </span>
                        {product.oldPrice && (
                          <span className="text-xs text-slate-400 line-through">
                            ${product.oldPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button className="group/btn flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-transparent px-3 text-sm font-semibold text-slate-700 transition-all hover:border-primary hover:bg-primary hover:text-slate-900">
                        Add
                        <span className="material-symbols-outlined text-[18px]">
                          add_shopping_cart
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination / Load more */}
          <div className="mt-12 flex items-center justify-center">
            <button className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-6 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors shadow-sm">
              Load More Products
              <span className="material-symbols-outlined text-lg">expand_more</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

