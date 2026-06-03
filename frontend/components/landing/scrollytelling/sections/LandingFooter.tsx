"use client";

import Link from "next/link";
import { useLandingCopy } from "@/hooks/useLandingCopy";

export default function LandingFooter() {
  const copy = useLandingCopy();
  const year = new Date().getFullYear();
  const copyright = copy.footer.copyright.replace("{year}", String(year));

  const sections = [
    {
      title: copy.footer.buyersTitle,
      links: [
        { label: copy.footer.links.postRequest, href: "/create-product-request" },
        { label: copy.footer.links.browseCatalog, href: "/products" },
        { label: copy.footer.links.howItWorks, href: "/#features" },
      ],
    },
    {
      title: copy.footer.sellersTitle,
      links: [
        { label: copy.footer.links.register, href: "/register" },
        { label: copy.footer.links.requestBoard, href: "/browse-buyer-requests" },
        { label: copy.footer.links.newListing, href: "/seller/products/new" },
      ],
    },
    {
      title: copy.footer.companyTitle,
      links: [
        { label: copy.footer.links.home, href: "/" },
        { label: copy.footer.links.login, href: "/login" },
      ],
    },
  ];

  return (
    <footer className="relative z-[2] w-full border-t border-white/[0.06] bg-mm-dark-bg">
      <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-0.5">
              <span className="text-xl font-extrabold tracking-tight text-white">Mollmart</span>
              <span className="text-2xl leading-none text-mm-primary">.</span>
            </Link>
            <p className="text-sm leading-[22px] text-mm-text-secondary">{copy.footer.tagline}</p>
            <p className="mt-2 text-xs text-[#64748b]">{copy.footer.educationalNote}</p>
          </div>

          {sections.map((section) => (
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
          <p className="text-center text-[13px] text-[#475569] sm:text-left">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
