"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroGradientCanvas from "@/components/landing/scrollytelling/HeroGradientCanvas";
import { useLandingCopy } from "@/hooks/useLandingCopy";

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const copy = useLandingCopy();
  const sectionRef = useRef<HTMLElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const group1Ref = useRef<HTMLDivElement>(null);
  const group2Ref = useRef<HTMLDivElement>(null);
  const group3Ref = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvasContainer = canvasContainerRef.current;
    const group1 = group1Ref.current;
    const group2 = group2Ref.current;
    const group3 = group3Ref.current;
    const cta = ctaRef.current;
    if (!section || !canvasContainer || !group1 || !group2 || !group3) return;

    const lines1 = group1.querySelectorAll(".hero-line-motion");
    const lines2 = group2.querySelectorAll(".hero-line-motion");
    const descLines = group3.querySelectorAll(".hero-desc-motion");

    const ctx = gsap.context(() => {
      gsap.set(descLines, { opacity: 0, y: 48 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          pin: canvasContainer,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          pinSpacing: false,
          invalidateOnRefresh: true,
        },
      });

      tl.to(lines1[0], { x: "-60vw", scale: 1.4, opacity: 0, ease: "none" }, 0);
      tl.to(lines1[1], { x: "60vw", scale: 1.4, opacity: 0, ease: "none" }, 0);

      tl.fromTo(lines2[0], { opacity: 0, x: "-60vw" }, { opacity: 1, x: 0, ease: "none" }, 0.45);
      tl.fromTo(lines2[1], { opacity: 0, y: 80 }, { opacity: 1, y: 0, ease: "none" }, 0.48);
      tl.fromTo(lines2[2], { opacity: 0, x: "60vw" }, { opacity: 1, x: 0, ease: "none" }, 0.51);
      tl.to(lines2, { opacity: 0, ease: "none" }, 0.9);

      tl.fromTo(
        descLines,
        { opacity: 0, y: 48 },
        { opacity: 1, y: 0, ease: "none", stagger: 0.02 },
        0.95,
      );

      if (cta) {
        tl.fromTo(cta, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, ease: "none" }, 0.98);
      }
    }, section);

    return () => ctx.revert();
  }, [copy]);

  const [g1a, g1b] = copy.hero.group1;
  const [g2a, g2b, g2c] = copy.hero.group2;

  return (
    <section id="hero" ref={sectionRef} className="relative w-full" style={{ height: "360vh" }}>
      <div ref={canvasContainerRef} className="absolute inset-x-0 top-0 h-screen w-full overflow-hidden">
        <HeroGradientCanvas className="absolute inset-0 h-full w-full" />

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center [&_a]:pointer-events-auto">
          <div
            ref={group1Ref}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <div className="hero-line text-center">
              <span className="hero-line-motion landing-hero-text landing-hero-display block font-semibold tracking-tight">
                {g1a}
              </span>
            </div>
            <div className="hero-line mt-2 text-center">
              <span className="hero-line-motion landing-hero-text-accent landing-hero-display block tracking-tight">
                {g1b}
              </span>
            </div>
          </div>

          <div
            ref={group2Ref}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <div className="hero-line text-center">
              <span className="hero-line-motion landing-hero-text landing-hero-display block font-semibold tracking-tight">
                {g2a}
              </span>
            </div>
            <div className="hero-line mt-2 text-center">
              <span className="hero-line-motion landing-hero-text-accent landing-hero-display block tracking-tight">
                {g2b}
              </span>
            </div>
            <div className="hero-line mt-2 text-center">
              <span className="hero-line-motion landing-hero-text landing-hero-display block font-semibold tracking-tight">
                {g2c}
              </span>
            </div>
          </div>

          <div
            ref={group3Ref}
            className="absolute flex max-w-[700px] flex-col items-center px-4"
            style={{ top: "38%" }}
          >
            <p className="text-center text-xl sm:text-2xl md:text-[32px] md:leading-tight">
              <span className="hero-desc-motion landing-hero-desc-text block font-medium">
                {copy.hero.descPrimary}
              </span>
            </p>
            <p className="mt-2 text-center text-xl sm:text-2xl md:text-[32px] md:leading-tight">
              <span className="hero-desc-motion landing-hero-desc-text-accent block">
                {copy.hero.descAccent}
              </span>
            </p>
            <div ref={ctaRef} className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <Link
                href="/create-product-request"
                className="rounded-full bg-[#e7e7e7] px-8 py-4 text-sm font-semibold uppercase tracking-wide text-[#16171a] transition-all hover:bg-[#242424] hover:text-white"
              >
                {copy.hero.ctaCreate}
              </Link>
              <Link
                href="/#features"
                className="rounded-full border border-[#16171a]/20 px-8 py-4 text-sm font-semibold uppercase tracking-wide text-[#16171a] transition-all hover:border-mm-primary hover:text-mm-primary"
              >
                {copy.hero.ctaExplore}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
