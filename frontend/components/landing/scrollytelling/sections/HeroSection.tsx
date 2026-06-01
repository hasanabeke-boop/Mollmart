"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown } from "lucide-react";
import WaveField from "@/components/landing/scrollytelling/WaveField";

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const waveOpacityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const waveEl = waveOpacityRef.current;
    if (!section || !content || !waveEl) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=200%",
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    tl.to(waveEl, { opacity: 0, duration: 0.5 }, 0.5);
    tl.to(content, { opacity: 0, y: -50, duration: 0.5 }, 0.5);

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} id="hero" className="relative min-h-[100dvh] w-full overflow-hidden">
      <div ref={waveOpacityRef} className="absolute inset-0">
        <WaveField />
      </div>

      <div
        ref={contentRef}
        className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-4 text-center sm:px-6"
      >
        <span className="mb-6 text-xs font-semibold uppercase tracking-[2px] text-[#94a3b8]">
          Demand-First Marketplace
        </span>

        <h1
          className="mb-6 text-4xl leading-tight font-extrabold tracking-[-1.5px] text-white sm:text-5xl md:text-6xl lg:text-[64px] md:leading-[72px]"
          style={{ textShadow: "0 2px 30px rgba(0,0,0,0.6)" }}
        >
          Where Demand
          <br />
          Meets Supply
        </h1>

        <p
          className="mb-10 max-w-[560px] text-base leading-relaxed font-normal text-white/75 sm:text-lg md:text-xl"
          style={{ textShadow: "0 1px 10px rgba(0,0,0,0.4)" }}
        >
          Post a request. Receive competing offers. Negotiate in chat.
          <br className="hidden sm:block" />
          The marketplace that works for you — not the other way around.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/create-product-request"
            className="rounded-[10px] bg-mm-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-mm-primary/25 transition-all hover:scale-105 hover:bg-mm-primary-hover active:scale-95"
          >
            Create a Request
          </Link>
          <Link
            href="/products"
            className="flex items-center gap-2 text-base font-medium text-white/70 transition-colors hover:text-white"
          >
            Browse Catalog
          </Link>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-pulse-slow">
          <ChevronDown className="h-6 w-6 text-white/40" aria-hidden />
        </div>
      </div>
    </section>
  );
}
