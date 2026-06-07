"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import WaveField from "@/components/landing/scrollytelling/WaveField";
import { useLandingCopy } from "@/hooks/useLandingCopy";

gsap.registerPlugin(ScrollTrigger);

export default function CtaSection() {
  const copy = useLandingCopy();
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const heading = headingRef.current;
    const content = contentRef.current;
    if (!section || !heading || !content) return;

    const ctx = gsap.context(() => {
      const words = heading.querySelectorAll(".word");
      gsap.from(words, {
        rotateX: -90,
        opacity: 0,
        stagger: 0.04,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: { trigger: section, start: "top 75%" },
      });

      gsap.from(content, {
        scale: 0.8,
        opacity: 0,
        duration: 0.8,
        delay: 0.5,
        ease: "back.out(1.5)",
        scrollTrigger: { trigger: section, start: "top 75%" },
      });
    }, section);

    return () => ctx.revert();
  }, [copy]);

  const words = copy.cta.title.split(" ");

  return (
    <section ref={sectionRef} id="cta" className="relative w-full overflow-hidden py-[160px]">
      <div className="absolute inset-0 bg-gradient-to-b from-mm-dark-bg to-[#111827]" />

      <div className="absolute inset-0 opacity-[0.12]">
        <WaveField opacity={0.12} />
      </div>

      <div className="relative z-10 mx-auto max-w-[1280px] px-4 text-center sm:px-6 lg:px-8">
        <h2
          ref={headingRef}
          className="perspective-1000 mb-6 text-3xl leading-tight font-extrabold tracking-[-1.5px] text-white sm:text-4xl md:text-5xl lg:text-[56px] lg:leading-[64px]"
        >
          {words.map((word, i) => (
            <span key={i} className="word mr-[0.3em] inline-block" style={{ transformOrigin: "50% 0%" }}>
              {word}
            </span>
          ))}
        </h2>

        <div ref={contentRef}>
          <p className="mx-auto mb-10 max-w-[480px] text-lg text-white/60">
            {copy.cta.subtitle}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="rounded-[10px] bg-mm-primary px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-mm-primary/25 transition-all hover:scale-105 hover:bg-mm-primary-hover active:scale-95"
            >
              {copy.cta.primary}
            </Link>
          </div>

          <Link
            href="/products"
            className="mt-4 inline-block text-base font-medium text-white/50 transition-colors hover:text-white/80"
          >
            {copy.cta.secondary}
          </Link>
        </div>
      </div>
    </section>
  );
}
