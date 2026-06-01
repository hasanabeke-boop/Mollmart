"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import ProgressNav from "@/components/landing/scrollytelling/ProgressNav";
import { LANDING_SECTION_IDS } from "@/components/landing/scrollytelling/constants";
import HeroSection from "@/components/landing/scrollytelling/sections/HeroSection";
import ProblemSection from "@/components/landing/scrollytelling/sections/ProblemSection";
import FeaturesSection from "@/components/landing/scrollytelling/sections/FeaturesSection";
import GallerySection from "@/components/landing/scrollytelling/sections/GallerySection";
import BuyerSection from "@/components/landing/scrollytelling/sections/BuyerSection";
import SellerSection from "@/components/landing/scrollytelling/sections/SellerSection";
import DualAccountSection from "@/components/landing/scrollytelling/sections/DualAccountSection";
import MetricsSection from "@/components/landing/scrollytelling/sections/MetricsSection";
import TestimonialsSection from "@/components/landing/scrollytelling/sections/TestimonialsSection";
import FaqSection from "@/components/landing/scrollytelling/sections/FaqSection";
import CtaSection from "@/components/landing/scrollytelling/sections/CtaSection";
import LandingFooter from "@/components/landing/scrollytelling/sections/LandingFooter";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollytellingLanding() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });

    document.documentElement.classList.add("lenis", "lenis-smooth");

    lenis.on("scroll", ScrollTrigger.update);

    // gsap.ticker passes `time` in SECONDS, but lenis.raf expects a
    // millisecond timestamp (like requestAnimationFrame). Without *1000 Lenis
    // sees ~0 delta per frame, its smoothing math breaks and scrolling stalls.
    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Recompute trigger positions after pin spacer + images settle (child effects
    // run before Lenis). Debounced — repeated refresh() during scroll can freeze.
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshTimer = undefined;
        ScrollTrigger.refresh();
      }, 400);
    };
    scheduleRefresh();
    window.addEventListener("load", scheduleRefresh, { once: true });

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      window.removeEventListener("load", scheduleRefresh);
      document.documentElement.classList.remove("lenis", "lenis-smooth");
      lenis.destroy();
      gsap.ticker.remove(raf);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div className="relative w-full">
      <ProgressNav sections={LANDING_SECTION_IDS} />
      <div>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <GallerySection />
        <BuyerSection />
        <SellerSection />
        <DualAccountSection />
        <MetricsSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection />
      </div>
      <LandingFooter />
    </div>
  );
}
