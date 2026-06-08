"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLandingCopy } from "@/hooks/useLandingCopy";

gsap.registerPlugin(ScrollTrigger);

export default function DualAccountSection() {
  const copy = useLandingCopy();
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    const badge = badgeRef.current;
    if (!section || !left || !right || !badge) return;

    const ctx = gsap.context(() => {
      gsap.from(left, {
        x: -100,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 70%" },
      });
      gsap.from(right, {
        x: 100,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 70%" },
      });
      gsap.from(badge, {
        scale: 0,
        opacity: 0,
        duration: 0.6,
        delay: 0.4,
        ease: "back.out(2)",
        scrollTrigger: { trigger: section, start: "top 70%" },
      });
    }, section);

    return () => ctx.revert();
  }, [copy]);

  const browserChrome = (
    <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
      <div className="h-3 w-3 rounded-full bg-red-500/80" />
      <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
      <div className="h-3 w-3 rounded-full bg-green-500/80" />
    </div>
  );

  return (
    <section ref={sectionRef} id="dual" className="w-full bg-mm-dark-bg py-[120px]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <span className="mb-4 block text-xs font-semibold uppercase tracking-[1.5px] text-mm-text-muted">
            {copy.dual.eyebrow}
          </span>
          <h2 className="text-3xl leading-tight font-bold tracking-[-1px] text-white sm:text-4xl lg:text-[48px] lg:leading-[56px]">
            {copy.dual.title}
            <br />
            {copy.dual.titleLine2}
          </h2>
        </div>

        <div className="relative flex flex-col items-center gap-8 lg:flex-row lg:gap-4">
          <div ref={leftRef} className="w-full flex-1">
            <div className="overflow-hidden rounded-xl bg-mm-dark-surface shadow-mockup">
              {browserChrome}
              <div className="border-b border-white/[0.06] bg-mm-dark-surface px-4 py-2 text-xs text-gray-500">
                Buyer Dashboard
              </div>
              <div className="relative aspect-[16/10] p-4">
                <Image
                  src="/landing/buyer.png"
                  alt="Buyer Dashboard"
                  fill
                  className="rounded-lg object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
            <p className="mt-4 text-center text-sm font-medium text-gray-400">
              {copy.dual.buyerCaption}
            </p>
          </div>

          <div
            ref={badgeRef}
            className="z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-mm-primary text-2xl font-bold text-white shadow-lg shadow-mm-primary/30"
          >
            VS
          </div>

          <div ref={rightRef} className="w-full flex-1">
            <div className="overflow-hidden rounded-xl bg-mm-dark-surface shadow-mockup">
              {browserChrome}
              <div className="border-b border-white/[0.06] bg-mm-dark-surface px-4 py-2 text-xs text-gray-500">
                Seller Dashboard
              </div>
              <div className="relative aspect-[16/10] p-4">
                <Image
                  src="/landing/seller.png"
                  alt="Seller Dashboard"
                  fill
                  className="rounded-lg object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
            <p className="mt-4 text-center text-sm font-medium text-gray-400">
              {copy.dual.sellerCaption}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
