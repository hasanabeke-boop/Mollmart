import Link from "next/link";

const categories = [
  {
    name: "Electronics",
    icon: "devices",
    href: "/browse-buyer-requests?q=electronics",
    tone: "from-blue-50 to-indigo-100 text-primary",
  },
  {
    name: "Home & Office",
    icon: "chair",
    href: "/browse-buyer-requests?q=office",
    tone: "from-emerald-50 to-teal-100 text-emerald-500",
  },
  {
    name: "Fashion",
    icon: "styler",
    href: "/browse-buyer-requests?q=fashion",
    tone: "from-rose-50 to-pink-100 text-rose-500",
  },
  {
    name: "Art & Collectibles",
    icon: "palette",
    href: "/browse-buyer-requests?q=collectibles",
    tone: "from-amber-50 to-orange-100 text-amber-500",
  },
  {
    name: "Sports",
    icon: "sports_basketball",
    href: "/browse-buyer-requests?q=sports",
    tone: "from-cyan-50 to-sky-100 text-cyan-500",
  },
  {
    name: "Hobbies & Specialty",
    icon: "toys",
    href: "/browse-buyer-requests?q=hobbies",
    tone: "from-purple-50 to-fuchsia-100 text-purple-500",
  },
];

export function CategoriesSection() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0d1b12] sm:text-3xl">
              Explore Request Categories
            </h2>
            <p className="mt-2 text-gray-500">Categories help buyers describe needs and sellers find matching demand.</p>
          </div>
          <Link
            href="/browse-buyer-requests"
            className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white hover:bg-[var(--primary-hover)] transition-colors shadow-lg shadow-primary/25"
            aria-label="Browse all request categories"
          >
              <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              className={`group relative overflow-hidden rounded-2xl h-48 bg-gradient-to-br ${category.tone} p-5 flex flex-col justify-end shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
              href={category.href}
            >
              <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                <span className="material-symbols-outlined text-[120px]">{category.icon}</span>
              </div>
              <div className="relative z-10">
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">{category.icon}</span>
                </div>
                <h3 className="font-bold text-[#0d1b12] text-lg">{category.name}</h3>
                <span className="text-xs text-gray-500 group-hover:text-current transition-colors flex items-center gap-1 mt-1">
                  View requests <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

