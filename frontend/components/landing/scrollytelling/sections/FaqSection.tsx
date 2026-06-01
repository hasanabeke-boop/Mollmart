"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown } from "lucide-react";
gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    q: "How is Mollmart different from Amazon or eBay?",
    a: "Traditional marketplaces are catalog-first — sellers list products and buyers search. Mollmart is demand-first — buyers post requests and sellers come to them. We also offer a catalog mode for instant purchases, giving you both worlds.",
  },
  {
    q: "Can I use Mollmart only as a buyer?",
    a: "Absolutely. Buyer mode is completely free. Post requests, receive offers, negotiate, and place orders — no subscription required.",
  },
  {
    q: "How does the pricing model work?",
    a: "Buyers use the platform for free. Sellers pay a small commission on completed deals. No listing fees, no monthly charges — you only pay when you make money.",
  },
  {
    q: "Are payments secure?",
    a: "We provide a secure deal flow with order tracking and payment status monitoring. All transactions are verified and recorded in your order history.",
  },
  {
    q: "What categories are supported?",
    a: "Electronics, Home & Garden, Fashion, Industrial Equipment, Services, Food & Beverage, Sports, Automotive, and more. New categories are added based on user demand.",
  },
  {
    q: "Is there a mobile app?",
    a: "Our platform is fully responsive and works great on mobile browsers. Native iOS and Android apps are coming in Q3 2026.",
  },
];

export default function FaqSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.from(section.querySelectorAll(".faq-item"), {
        x: -30,
        opacity: 0,
        stagger: 0.08,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: { trigger: section, start: "top 70%" },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="faq" className="w-full bg-white py-[120px] dark:bg-mm-dark-surface">
      <div className="mx-auto max-w-[800px] px-4 sm:px-6">
        <div className="mb-16 text-center">
          <span className="mb-4 block text-xs font-semibold uppercase tracking-[1.5px] text-mm-text-muted">
            FAQ
          </span>
          <h2 className="text-3xl leading-tight font-bold tracking-[-1px] text-mm-text sm:text-4xl lg:text-[48px] lg:leading-[56px] dark:text-white">
            Common Questions
          </h2>
        </div>

        <div>
          {faqs.map((faq, i) => (
            <div key={faq.q} className="faq-item border-b border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="group flex w-full items-center justify-between py-6 text-left"
              >
                <span className="pr-4 text-base font-semibold text-mm-text transition-colors group-hover:text-mm-primary dark:text-white">
                  {faq.q}
                </span>
                <ChevronDown
                  size={20}
                  className={`shrink-0 text-mm-text-muted transition-transform duration-300 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === i ? "max-h-48 pb-6" : "max-h-0"
                }`}
              >
                <p className="text-[15px] leading-[26px] text-mm-text-secondary dark:text-gray-400">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
