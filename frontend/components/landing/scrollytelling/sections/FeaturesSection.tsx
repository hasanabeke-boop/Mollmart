"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ShoppingCart, Send, MessageCircle } from "lucide-react";
gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: ShoppingCart,
    title: "Buy Now",
    description:
      "Browse catalog, add to cart, checkout instantly. Classic marketplace for ready-made products.",
    gradient: "from-[#f0f4ff] to-white dark:from-mm-dark-elevated dark:to-mm-dark-surface",
    iconColor: "#607afb",
  },
  {
    icon: Send,
    title: "Request & Receive",
    description:
      "Post what you need. Sellers see live demand and send competing offers directly to you.",
    gradient: "from-[#f0fdf4] to-white dark:from-mm-dark-elevated dark:to-mm-dark-surface",
    iconColor: "#4c9a66",
  },
  {
    icon: MessageCircle,
    title: "Negotiate & Deal",
    description:
      "Compare offers, chat with sellers, agree on terms — all inside one transparent platform.",
    gradient: "from-[#fffbeb] to-white dark:from-mm-dark-elevated dark:to-mm-dark-surface",
    iconColor: "#f59e0b",
  },
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const heading = headingRef.current;
    const cards = cardsRef.current;
    if (!section || !heading || !cards) return;

    const ctx = gsap.context(() => {
      const text = heading.textContent || "";
      const chars = text.split("");
      heading.innerHTML = chars
        .map(
          (char) =>
            `<span style="display:inline-block;transform-origin:50% 0%">${
              char === " " ? "&nbsp;" : char
            }</span>`,
        )
        .join("");

      gsap.from(heading.querySelectorAll("span"), {
        rotateX: -90,
        opacity: 0,
        stagger: 0.03,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: { trigger: section, start: "top 80%" },
      });

      gsap.from(cards.children, {
        rotateY: 25,
        z: -200,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: { trigger: cards, start: "top 75%" },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="features" className="w-full bg-white py-[120px] dark:bg-mm-dark-surface">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <span className="mb-4 block text-xs font-semibold uppercase tracking-[1.5px] text-mm-text-muted">
            How It Works
          </span>
          <h2
            ref={headingRef}
            className="text-3xl leading-tight font-bold tracking-[-1px] text-mm-text sm:text-4xl lg:text-[48px] lg:leading-[56px] dark:text-white"
          >
            Three Ways to Trade
          </h2>
        </div>

        <div ref={cardsRef} className="perspective-1000 preserve-3d grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`group relative rounded-[20px] border border-black/[0.06] bg-gradient-to-b p-10 transition-all duration-500 hover:-translate-y-2 hover:shadow-card-hover sm:p-12 dark:border-white/[0.06] ${feature.gradient}`}
            >
              <feature.icon size={48} style={{ color: feature.iconColor }} className="mb-6" />
              <h3 className="mb-4 text-xl font-semibold text-mm-text sm:text-2xl dark:text-white">
                {feature.title}
              </h3>
              <p className="text-sm leading-[24px] text-mm-text-secondary dark:text-gray-400">
                {feature.description}
              </p>
              <div
                className="pointer-events-none absolute inset-0 rounded-[20px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ boxShadow: `0 0 60px ${feature.iconColor}15` }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
