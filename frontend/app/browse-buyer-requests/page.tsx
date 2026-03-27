'use client';

import Link from "next/link";
import { useMemo, useState } from "react";

type Category =
  | "Technology"
  | "Home & Decor"
  | "Sustainability"
  | "Collectibles"
  | "Fashion"
  | "Services";

type BuyerRequest = {
  id: number;
  title: string;
  category: Category;
  icon: string;
  iconBg: string;
  iconColor: string;
  barColor: string;
  budget: string;
  budgetMin: number;
  barPercent: string;
  description: string;
  postedAgo: string;
  offers: number;
  urgent?: boolean;
  trending?: boolean;
  image?: string;
};

const REQUESTS: BuyerRequest[] = [
  {
    id: 1,
    title: "High-End Custom Workstation for Video Editing",
    category: "Technology",
    icon: "computer",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    barColor: "bg-blue-500",
    budget: "$4,500 - $6,000",
    budgetMin: 4500,
    barPercent: "w-[90%]",
    description:
      "Looking for a builder to assemble a workstation capable of handling 8K RAW footage. Must include at least 128GB RAM and top-tier GPU.",
    postedAgo: "Posted Oct 24, 2023",
    offers: 7,
    urgent: true,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBhi-lXxeUO4QKVd0cHUXg9me5PlqDPgiCGyhU5J1lM3jGWMRbLAABUpjsLroo3l8QO9bS7y-iS_5oRTk-NMz5y8eLms237n2e954ZdlmjtWIhADbG_TFijB6KTxL5fguWB9wxNgMUXJPdiCNxdcXj3JRcMzhyjhv2ibjsCVvIYXT0aiY4kciFOF_Q1Ssm-hH1kUnFqp4umAhRFQd6-wf7DTeGV9DqpClhAS_FBhR69d9J_iHQEISa0ouYEIFFfIfsGUq4G98a0xsc",
  },
  {
    id: 2,
    title: "Mid-Century Modern Sofa",
    category: "Home & Decor",
    icon: "chair",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    barColor: "bg-orange-500",
    budget: "$1,200",
    budgetMin: 1200,
    barPercent: "w-3/4",
    description:
      "Seeking a velvet finish sofa in emerald green with walnut tapered legs. Local delivery preferred.",
    postedAgo: "Posted 2h ago",
    offers: 4,
    trending: true,
  },
  {
    id: 3,
    title: "Solar Power Kit for Van",
    category: "Sustainability",
    icon: "eco",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    barColor: "bg-emerald-500",
    budget: "$2,500",
    budgetMin: 2500,
    barPercent: "w-1/2",
    description:
      "Complete off-grid system including panels, lithium batteries, and inverter. Must be modular.",
    postedAgo: "Posted 5h ago",
    offers: 12,
    trending: true,
  },
  {
    id: 4,
    title: "Vintage Chronograph Watch",
    category: "Collectibles",
    icon: "watch",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    barColor: "bg-purple-500",
    budget: "$8,000+",
    budgetMin: 8000,
    barPercent: "w-full",
    description:
      "Searching for a 1970s era Omega Speedmaster in original condition. Documentation required.",
    postedAgo: "Posted 1d ago",
    offers: 2,
  },
  {
    id: 5,
    title: "Custom Leather Messenger Bag",
    category: "Fashion",
    icon: "shopping_bag",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    barColor: "bg-rose-500",
    budget: "$350",
    budgetMin: 350,
    barPercent: "w-2/5",
    description:
      "Looking for full-grain Italian leather, hand-stitched, with brass hardware. Must fit a 15-inch laptop.",
    postedAgo: "Posted 3h ago",
    offers: 6,
    trending: true,
  },
  {
    id: 6,
    title: "Smart Home Security Setup",
    category: "Technology",
    icon: "shield",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    barColor: "bg-blue-500",
    budget: "$1,800",
    budgetMin: 1800,
    barPercent: "w-3/5",
    description:
      "Need a complete smart security system: 6 cameras, motion sensors, smart locks, and a central hub. Professional installation required.",
    postedAgo: "Posted 8h ago",
    offers: 3,
  },
  {
    id: 7,
    title: "Reclaimed Wood Dining Table",
    category: "Home & Decor",
    icon: "table_restaurant",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    barColor: "bg-orange-500",
    budget: "$2,200",
    budgetMin: 2200,
    barPercent: "w-2/3",
    description:
      "Farmhouse-style table from reclaimed oak, seats 8, with live edge. Matching bench optional.",
    postedAgo: "Posted 12h ago",
    offers: 5,
  },
  {
    id: 8,
    title: "Website Redesign for E-commerce",
    category: "Services",
    icon: "design_services",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
    barColor: "bg-cyan-500",
    budget: "$3,000 - $5,000",
    budgetMin: 3000,
    barPercent: "w-[70%]",
    description:
      "Need a modern Shopify redesign: homepage, product pages, and checkout. Must be mobile-first with fast load times.",
    postedAgo: "Posted 6h ago",
    offers: 9,
    urgent: true,
  },
];

const MY_CATEGORIES: Category[] = ["Technology", "Services"];

type FilterTab = "all" | "my-categories" | "trending";

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All Requests" },
  { id: "my-categories", label: "My Categories" },
  { id: "trending", label: "Trending Demand" },
];

function OfferModal({
  request,
  onClose,
}: {
  request: BuyerRequest;
  onClose: () => void;
}) {
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [delivery, setDelivery] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    const num = Number(price);
    if (!price || Number.isNaN(num) || num <= 0) return;
    setSent(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-[scale-in_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Make an Offer</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-green-600 text-3xl">
                check_circle
              </span>
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">
              Offer Sent!
            </h4>
            <p className="text-slate-500 text-sm mb-2">
              Your offer of <span className="font-bold text-slate-900">${Number(price).toFixed(2)}</span> for
            </p>
            <p className="font-semibold text-slate-800 mb-4">
              &ldquo;{request.title}&rdquo;
            </p>
            <p className="text-xs text-slate-400 mb-6">
              The buyer will be notified and can accept, decline, or counter
              your offer.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-[#607afb] text-white py-3 rounded-xl font-bold hover:brightness-110 transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">
                Request
              </p>
              <p className="font-bold text-slate-900">{request.title}</p>
              <p className="text-sm text-slate-500 mt-1">
                Buyer budget: {request.budget}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Your Price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-400 font-medium">
                  $
                </span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-900"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Estimated Delivery
              </label>
              <div className="relative">
                <select
                  value={delivery}
                  onChange={(e) => setDelivery(e.target.value)}
                  className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white text-slate-900"
                >
                  <option value="">Select timeframe</option>
                  <option value="1-3">1-3 business days</option>
                  <option value="3-7">3-7 business days</option>
                  <option value="1-2w">1-2 weeks</option>
                  <option value="2-4w">2-4 weeks</option>
                  <option value="custom">Custom / Contact buyer</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-3.5 text-slate-400 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Message to Buyer{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder:text-slate-400 resize-none"
                placeholder="Describe why you're the right seller, your experience, etc."
              />
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={!price || Number(price) <= 0}
              className="w-full bg-[#607afb] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">
                send
              </span>
              Send Offer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrowseBuyerRequestsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "">("");
  const [showFilters, setShowFilters] = useState(false);
  const [offerTarget, setOfferTarget] = useState<BuyerRequest | null>(null);

  const filteredRequests = useMemo(() => {
    let data = REQUESTS;

    if (activeTab === "my-categories") {
      data = data.filter((r) => MY_CATEGORIES.includes(r.category));
    } else if (activeTab === "trending") {
      data = data.filter((r) => r.trending);
    }

    if (selectedCategory) {
      data = data.filter((r) => r.category === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q),
      );
    }

    return data;
  }, [activeTab, search, selectedCategory]);

  const featuredRequest = filteredRequests.find((r) => r.image);
  const regularRequests = filteredRequests.filter((r) => r !== featuredRequest);

  const allCategories = Array.from(
    new Set(REQUESTS.map((r) => r.category)),
  ) as Category[];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">
            Buyer Requests
          </h1>
          <p className="text-slate-500">
            Find your next customer by browsing active purchase requests.
          </p>
        </div>
        <Link
          href="/create-product-request"
          className="flex items-center gap-2 bg-[#607afb] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Post a Request
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          search
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder:text-slate-400"
          placeholder="Search requests by title, description, or category..."
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <span className="material-symbols-outlined text-[20px]">
              close
            </span>
          </button>
        )}
      </div>

      {/* Filter Tabs + Filters */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2 scrollbar-hide gap-4">
        <div className="flex p-1 bg-slate-200/50 rounded-xl backdrop-blur-sm">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-blue-600 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors ${
              showFilters || selectedCategory
                ? "border-blue-400 text-blue-600"
                : "border-slate-200 text-slate-700"
            }`}
          >
            <span className="material-symbols-outlined text-lg">tune</span>
            <span>Filters</span>
            {selectedCategory && (
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">
            Category:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory("")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !selectedCategory
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() =>
                setSelectedCategory(selectedCategory === cat ? "" : cat)
              }
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
          {selectedCategory && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("");
                setShowFilters(false);
              }}
              className="ml-auto text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">
                close
              </span>
              Clear
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-slate-500 mb-4">
        Showing{" "}
        <span className="font-bold text-slate-900">
          {filteredRequests.length}
        </span>{" "}
        request{filteredRequests.length !== 1 ? "s" : ""}
      </p>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-slate-400 text-3xl">
              search_off
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            No requests found
          </h3>
          <p className="text-slate-500 text-sm mb-4">
            Try adjusting your search or filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory("");
              setActiveTab("all");
            }}
            className="text-sm text-blue-600 font-bold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Featured Card (first request with image) */}
          {featuredRequest && (
            <div className="lg:col-span-2 bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col md:flex-row group transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="w-full md:w-2/5 relative h-48 md:h-auto">
                <img
                  className="w-full h-full object-cover"
                  alt={featuredRequest.title}
                  src={featuredRequest.image}
                />
                {featuredRequest.urgent && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                      Urgent Request
                    </span>
                  </div>
                )}
              </div>
              <div className="p-8 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1 block">
                        Category: {featuredRequest.category}
                      </span>
                      <h3 className="text-2xl font-bold leading-tight">
                        {featuredRequest.title}
                      </h3>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="text-sm text-slate-400 mb-1">Budget</p>
                      <p className="text-xl font-black text-slate-900">
                        {featuredRequest.budget}
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-600 line-clamp-2 mb-6">
                    {featuredRequest.description}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400 text-sm">
                        calendar_today
                      </span>
                      <span className="text-sm text-slate-500">
                        {featuredRequest.postedAgo}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-sm text-slate-500">
                      <span className="material-symbols-outlined text-sm">
                        group
                      </span>
                      {featuredRequest.offers} Offers
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOfferTarget(featuredRequest)}
                    className="bg-[#607afb] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Make an Offer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Regular Cards */}
          {regularRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col justify-between hover:shadow-lg transition-shadow"
            >
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl ${req.iconBg} flex items-center justify-center ${req.iconColor}`}
                  >
                    <span className="material-symbols-outlined">
                      {req.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      {req.category}
                    </span>
                    <h3 className="font-bold text-lg truncate">{req.title}</h3>
                  </div>
                  {req.urgent && (
                    <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                      Urgent
                    </span>
                  )}
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-500">Buyer Budget</span>
                    <span className="text-lg font-bold text-slate-900">
                      {req.budget}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className={`${req.barColor} h-full ${req.barPercent}`} />
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-6 line-clamp-2">
                  {req.description}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>{req.postedAgo}</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">
                      group
                    </span>{" "}
                    {req.offers} Offers
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOfferTarget(req)}
                  className="w-full bg-[#607afb] text-white py-3 rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  Make an Offer
                </button>
              </div>
            </div>
          ))}

          {/* Pro Seller Tip Banner */}
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
            <div className="z-10 text-center md:text-left">
              <span className="bg-white/20 backdrop-blur-md text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
                Pro Seller Tip
              </span>
              <h2 className="text-3xl font-black mb-4 leading-tight">
                Increase your conversion by 40% with Detailed Proposals.
              </h2>
              <p className="text-blue-100 mb-6 max-w-md">
                Buyers are more likely to accept offers that include specific
                shipping timelines and high-resolution portfolio images.
              </p>
              <button className="bg-white text-blue-600 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-50 transition-colors">
                Learn How
              </button>
            </div>
            <div className="relative z-10 w-full md:w-1/3">
              <div className="glass-card p-4 rounded-2xl shadow-2xl rotate-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100" />
                  <div className="h-2 w-24 bg-blue-200 rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full bg-slate-200/50 rounded-full" />
                  <div className="h-2 w-5/6 bg-slate-200/50 rounded-full" />
                  <div className="h-10 w-full bg-blue-500/50 rounded-xl mt-4" />
                </div>
              </div>
            </div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {offerTarget && (
        <OfferModal
          request={offerTarget}
          onClose={() => setOfferTarget(null)}
        />
      )}
    </div>
  );
}
