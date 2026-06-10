"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Eye, Zap, MessageSquare, ShoppingBag } from "lucide-react";
import { useLandingCopy } from "@/hooks/useLandingCopy";

gsap.registerPlugin(ScrollTrigger);

const stepIcons = [Eye, Zap, MessageSquare, ShoppingBag] as const;

export default function SellerSection() {
  const copy = useLandingCopy();
  const sectionRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stepsEl = stepsRef.current;
    if (!section || !stepsEl) return;

    const ctx = gsap.context(() => {
      gsap.from(stepsEl.querySelectorAll(".step-card"), {
        x: 80,
        opacity: 0,
        stagger: 0.2,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 60%" },
      });
    }, section);

    return () => ctx.revert();
  }, [copy]);

  return (
    <section ref={sectionRef} id="sellers" className="w-full bg-mm-bg py-[120px] dark:bg-mm-dark-bg">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-12 lg:flex-row-reverse lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:w-[40%]">
            <span className="mb-4 block text-xs font-semibold uppercase tracking-[1.5px] text-mm-text-muted">
              {copy.seller.eyebrow}
            </span>
            <h2 className="mb-6 text-3xl leading-tight font-bold tracking-[-1px] text-mm-text sm:text-4xl lg:text-[48px] lg:leading-[56px] dark:text-white">
              {copy.seller.title}
            </h2>
            <p className="mb-8 text-base leading-[26px] text-mm-text-secondary dark:text-gray-400">
              {copy.seller.body}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/browse-buyer-requests"
                className="rounded-[10px] bg-mm-primary px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-mm-primary-hover"
              >
                {copy.seller.cta}
              </Link>
              <Link
                href="/seller/products/new"
                className="rounded-[10px] border border-mm-primary bg-mm-surface px-6 py-3 text-center font-semibold text-mm-primary transition-colors hover:bg-mm-primary/5 dark:bg-mm-dark-elevated"
              >
                {copy.seller.addProductCta}
              </Link>
            </div>
          </div>

          <div ref={stepsRef} className="space-y-6 lg:w-[60%]">
            {copy.seller.steps.map((s, i) => {
              const Icon = stepIcons[i] ?? Eye;
              const stepNum = String(i + 1).padStart(2, "0");
              return (
              <div
                key={stepNum}
                className="step-card flex items-start gap-5 rounded-2xl border border-transparent bg-white p-6 shadow-card transition-shadow hover:border-mm-accent-green/20 hover:shadow-card-hover sm:gap-6 sm:p-8 dark:bg-mm-dark-elevated"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-mm-accent-green/10 dark:bg-mm-accent-green/20">
                  <Icon size={26} className="text-mm-accent-green" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="rounded bg-mm-accent-green/10 px-2 py-0.5 text-xs font-bold text-mm-accent-green dark:bg-mm-accent-green/20">
                      {stepNum}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-mm-text sm:text-xl dark:text-white">
                    {s.title}
                  </h3>
                  <p className="text-sm leading-[22px] text-mm-text-secondary dark:text-gray-400">
                    {s.description}
                  </p>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
