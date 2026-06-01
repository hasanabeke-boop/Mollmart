import Link from "next/link";

const footerLinks = {
  buyers: {
    title: "For Buyers",
    links: [
      { label: "Post a Request", href: "/create-product-request" },
      { label: "Browse Catalog", href: "/products" },
      { label: "How It Works", href: "/#features" },
    ],
  },
  sellers: {
    title: "For Sellers",
    links: [
      { label: "Register", href: "/register" },
      { label: "View Request Board", href: "/browse-buyer-requests" },
      { label: "New Listing", href: "/seller/products/new" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "Home", href: "/" },
      { label: "Login", href: "/login" },
    ],
  },
};

export default function LandingFooter() {
  return (
    <footer className="w-full border-t border-white/[0.06] bg-mm-dark-bg">
      <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-0.5">
              <span className="text-xl font-extrabold tracking-tight text-white">Mollmart</span>
              <span className="text-2xl leading-none text-mm-primary">.</span>
            </Link>
            <p className="text-sm leading-[22px] text-mm-text-secondary">
              The demand-first marketplace for modern businesses.
            </p>
          </div>

          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="mb-4 text-sm font-semibold text-white">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#94a3b8] transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-[13px] text-[#475569]">
            &copy; {new Date().getFullYear()} Mollmart Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
