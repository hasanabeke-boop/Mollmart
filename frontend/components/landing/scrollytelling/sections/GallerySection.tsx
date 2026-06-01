"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Laptop,
  Home,
  Shirt,
  Factory,
  Wrench,
  Utensils,
  Dumbbell,
  Car,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const categories = [
  { name: "Electronics", icon: Laptop, requests: 124 },
  { name: "Home & Garden", icon: Home, requests: 89 },
  { name: "Fashion", icon: Shirt, requests: 203 },
  { name: "Industrial", icon: Factory, requests: 56 },
  { name: "Services", icon: Wrench, requests: 178 },
  { name: "Food & Beverage", icon: Utensils, requests: 92 },
  { name: "Sports", icon: Dumbbell, requests: 67 },
  { name: "Automotive", icon: Car, requests: 45 },
];

const requests = [
  { title: "Need 50 custom t-shirts", budget: "$400-$600", location: "Austin, TX" },
  { title: "Wholesale coffee supplier", budget: "$2K-$5K/mo", location: "Seattle, WA" },
  { title: "Office furniture set", budget: "$1,500-$3,000", location: "Denver, CO" },
  { title: "Branded merchandise", budget: "$800-$1,200", location: "Miami, FL" },
  { title: "Organic skincare bulk", budget: "$3K-$6K", location: "Portland, OR" },
  { title: "Event catering service", budget: "$1,200-$2,500", location: "NYC, NY" },
  { title: "Tech accessories bundle", budget: "$500-$900", location: "SF, CA" },
  { title: "Custom packaging boxes", budget: "$600-$1,000", location: "Chicago, IL" },
];

const productMocks = [1, 2, 3, 4, 1, 2] as const;

export default function GallerySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const row3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const row1 = row1Ref.current;
    const row2 = row2Ref.current;
    const row3 = row3Ref.current;
    if (!section || !row1 || !row2 || !row3) return;

    const ctx = gsap.context(() => {
      gsap.to(row1, {
        x: -500,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 1 },
      });
      gsap.to(row2, {
        x: 300,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 0.7 },
      });
      gsap.to(row3, {
        x: -600,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 1.3 },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="gallery"
      className="w-full overflow-hidden bg-mm-bg py-[120px] dark:bg-mm-dark-bg"
    >
      <div className="mx-auto mb-16 max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="mb-4 block text-xs font-semibold uppercase tracking-[1.5px] text-mm-text-muted">
            Live Categories
          </span>
          <h2 className="text-3xl leading-tight font-bold tracking-[-1px] text-mm-text sm:text-4xl lg:text-[48px] lg:leading-[56px] dark:text-white">
            From Electronics to Services
          </h2>
        </div>
      </div>

      <div ref={row1Ref} className="mb-6 flex gap-6 px-4">
        {[...categories, ...categories].map((cat, i) => (
          <div
            key={`${cat.name}-${i}`}
            className="group flex h-[260px] w-[200px] shrink-0 flex-col items-center justify-center rounded-2xl bg-mm-surface p-6 text-center shadow-sm transition-shadow hover:shadow-md dark:bg-mm-dark-elevated"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-mm-primary/10 transition-transform group-hover:scale-110 dark:bg-mm-primary/20">
              <cat.icon size={28} className="text-mm-primary" />
            </div>
            <h4 className="mb-1 text-sm font-semibold text-mm-text dark:text-white">{cat.name}</h4>
            <span className="text-xs text-mm-text-muted">{cat.requests} active requests</span>
          </div>
        ))}
      </div>

      <div ref={row2Ref} className="mb-6 flex gap-6 px-4">
        {productMocks.map((num, i) => (
          <div
            key={`product-${i}`}
            className="relative h-[180px] w-[240px] shrink-0 overflow-hidden rounded-2xl bg-mm-surface shadow-sm dark:bg-mm-dark-elevated"
          >
            <Image
              src={`/landing/img-product-mock-${num}.jpg`}
              alt="Product"
              fill
              className="object-cover"
              sizes="240px"
            />
          </div>
        ))}
      </div>

      <div ref={row3Ref} className="flex gap-6 px-4">
        {[...requests, ...requests].map((req, i) => (
          <div
            key={`${req.title}-${i}`}
            className="flex h-[140px] w-[280px] shrink-0 flex-col justify-between rounded-2xl border border-black/[0.04] bg-mm-surface p-5 shadow-sm dark:border-white/[0.04] dark:bg-mm-dark-elevated"
          >
            <div>
              <h4 className="mb-1 truncate text-sm font-semibold text-mm-text dark:text-white">
                {req.title}
              </h4>
              <span className="text-xs text-mm-text-muted">{req.location}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-mm-primary/10 px-2 py-1 text-xs font-semibold text-mm-primary dark:bg-mm-primary/20">
                {req.budget}
              </span>
              <span className="text-xs font-medium text-mm-accent-green">Open</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
