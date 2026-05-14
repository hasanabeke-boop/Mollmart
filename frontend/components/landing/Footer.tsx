import Link from "next/link";

const footerGroups = [
  {
    title: "Requests",
    links: [
      { label: "Create Request", href: "/create-product-request" },
      { label: "Browse Demand", href: "/browse-buyer-requests" },
      { label: "Categories", href: "/browse-buyer-requests" },
    ],
  },
  {
    title: "Sell",
    links: [
      { label: "Seller Dashboard", href: "/seller/dashboard" },
      { label: "Check Demand", href: "/browse-buyer-requests" },
      { label: "Seller Handbook", href: "/help" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Safety & Trust", href: "/help" },
      { label: "Contact Us", href: "/chatbot" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/help" },
      { label: "Terms", href: "/help" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link className="flex items-center gap-2 mb-4 group" href="/">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white group-hover:rotate-6 transition-transform">
                <span className="material-symbols-outlined">storefront</span>
              </div>
              <span className="text-xl font-bold text-[#0d1b12]">Mollmart</span>
            </Link>
            <p className="text-sm text-gray-500">
              Connecting buyers and sellers through requests, offers, and direct communication.
            </p>
            <div className="mt-6 flex space-x-4">
              <Link className="text-gray-400 hover:text-primary transition-colors hover:scale-110" href="/help">
                <span className="sr-only">Community help</span>
                <span className="material-symbols-outlined">groups</span>
              </Link>
              <Link className="text-gray-400 hover:text-primary transition-colors hover:scale-110" href="/chatbot">
                <span className="sr-only">Assistant</span>
                <span className="material-symbols-outlined">smart_toy</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold leading-6 text-[#0d1b12]">{group.title}</h3>
                <ul className="mt-4 space-y-3" role="list">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link className="text-sm leading-6 text-gray-500 hover:text-primary transition-colors" href={link.href}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-gray-100 pt-8">
          <p className="text-xs text-gray-500">© 2026 Mollmart Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
