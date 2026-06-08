"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown } from "lucide-react";
import { useLandingCopy } from "@/hooks/useLandingCopy";

gsap.registerPlugin(ScrollTrigger);

export default function FaqSection() {
  const copy = useLandingCopy();
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
  }, [copy]);

  return (
    <section ref={sectionRef} id="faq" className="w-full bg-white py-[120px] dark:bg-mm-dark-surface">
      <div className="mx-auto max-w-[800px] px-4 sm:px-6">
        <div className="mb-16 text-center">
          <span className="mb-4 block text-xs font-semibold uppercase tracking-[1.5px] text-mm-text-muted">
            {copy.faq.eyebrow}
          </span>
          <h2 className="text-3xl leading-tight font-bold tracking-[-1px] text-mm-text sm:text-4xl lg:text-[48px] lg:leading-[56px] dark:text-white">
            {copy.faq.title}
          </h2>
        </div>

        <div>
          {copy.faq.items.map((faq, i) => (
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
                  className={`h-5 w-5 shrink-0 text-mm-text-muted transition-transform duration-300 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === i ? "max-h-96 pb-6" : "max-h-0"
                }`}
              >
                <p className="text-sm leading-[24px] text-mm-text-secondary dark:text-gray-400">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
