"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SearchX, Hourglass, Ban } from "lucide-react";
gsap.registerPlugin(ScrollTrigger);

const painPoints = [
  {
    icon: SearchX,
    title: "Sellers Stock Without Demand",
    description:
      "You invest in inventory, pay for storage, and pray the right buyer finds your listing.",
    color: "#f59e0b",
  },
  {
    icon: Hourglass,
    title: "Buyers Search Endlessly",
    description:
      "Dozens of tabs, countless stores, and still no guarantee you found the best deal.",
    color: "#ef4444",
  },
  {
    icon: Ban,
    title: "No Negotiation Layer",
    description:
      "Fixed prices mean zero flexibility. You either accept or walk away — no conversation.",
    color: "#8b5cf6",
  },
];

export default function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const text = textRef.current;
    const cards = cardsRef.current;
    if (!section || !text || !cards) return;

    const ctx = gsap.context(() => {
      gsap.from(text, {
        x: -60,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 75%" },
      });

      gsap.from(cards.children, {
        y: 80,
        opacity: 0,
        stagger: 0.15,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 70%" },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="problem" className="w-full bg-mm-bg py-[120px] dark:bg-mm-dark-bg">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-12 lg:flex-row lg:gap-16">
          <div ref={textRef} className="lg:w-[45%]">
            <span className="mb-4 block text-xs font-semibold uppercase tracking-[1.5px] text-mm-text-muted">
              The Problem
            </span>
            <h2 className="mb-6 text-3xl leading-tight font-bold tracking-[-1px] text-mm-text sm:text-4xl lg:text-[48px] lg:leading-[56px] dark:text-white">
              Traditional Marketplaces
              <br />
              Force Guessing
            </h2>
            <p className="max-w-[420px] text-base leading-[26px] text-mm-text-secondary dark:text-gray-400">
              Sellers stock products hoping someone buys. Buyers scroll through hundreds of listings to
              find what they need. No negotiation, no transparency, no connection.
            </p>
          </div>

          <div ref={cardsRef} className="grid gap-6 sm:grid-cols-2 lg:w-[55%] lg:grid-cols-3 lg:gap-8">
            {painPoints.map((point) => (
              <div
                key={point.title}
                className="rounded-2xl bg-mm-surface p-8 shadow-card transition-shadow duration-300 hover:shadow-card-hover sm:p-10 dark:bg-mm-dark-elevated"
              >
                <point.icon size={32} style={{ color: point.color }} className="mb-5" />
                <h3 className="mb-3 text-lg font-semibold text-mm-text dark:text-white">{point.title}</h3>
                <p className="text-sm leading-[22px] text-mm-text-secondary dark:text-gray-400">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
