"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SearchX, Hourglass, Ban } from "lucide-react";
import { useLandingCopy } from "@/hooks/useLandingCopy";

gsap.registerPlugin(ScrollTrigger);

const painIcons = [SearchX, Hourglass, Ban] as const;
const painColors = ["#f59e0b", "#ef4444", "#8b5cf6"] as const;

export default function ProblemSection() {
  const copy = useLandingCopy();
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
  }, [copy]);

  return (
    <section ref={sectionRef} id="problem" className="w-full bg-mm-bg py-[120px] dark:bg-mm-dark-bg">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-12 lg:flex-row lg:gap-16">
          <div ref={textRef} className="lg:w-[45%]">
            <span className="mb-4 block text-xs font-semibold uppercase tracking-[1.5px] text-mm-text-muted">
              {copy.problem.eyebrow}
            </span>
            <h2 className="mb-6 text-3xl leading-tight font-bold tracking-[-1px] text-mm-text sm:text-4xl lg:text-[48px] lg:leading-[56px] dark:text-white">
              {copy.problem.title}
              <br />
              {copy.problem.titleLine2}
            </h2>
            <p className="max-w-[420px] text-base leading-[26px] text-mm-text-secondary dark:text-gray-400">
              {copy.problem.body}
            </p>
          </div>

          <div ref={cardsRef} className="grid gap-6 sm:grid-cols-2 lg:w-[55%] lg:grid-cols-3 lg:gap-8">
            {copy.problem.cards.map((point, i) => {
              const Icon = painIcons[i] ?? SearchX;
              return (
                <div
                  key={point.title}
                  className="rounded-2xl bg-mm-surface p-8 shadow-card transition-shadow duration-300 hover:shadow-card-hover sm:p-10 dark:bg-mm-dark-elevated"
                >
                  <Icon size={32} style={{ color: painColors[i] }} className="mb-5" />
                  <h3 className="mb-3 text-lg font-semibold text-mm-text dark:text-white">{point.title}</h3>
                  <p className="text-sm leading-[22px] text-mm-text-secondary dark:text-gray-400">
                    {point.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
