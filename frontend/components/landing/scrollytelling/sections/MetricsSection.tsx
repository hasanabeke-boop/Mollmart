"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const metrics = [
  { value: 12847, label: "Active Requests", color: "#607afb" },
  { value: 4291, label: "Registered Sellers", color: "#4c9a66" },
  { value: 28, label: "Categories", color: "#f59e0b" },
  { value: 8502, label: "Completed Deals", color: "#8b5cf6" },
];

export default function MetricsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const counterEls = section.querySelectorAll<HTMLElement>("[data-metric-value]");

      ScrollTrigger.create({
        trigger: section,
        start: "top 75%",
        once: true,
        onEnter: () => {
          counterEls.forEach((el) => {
            const target = Number(el.dataset.metricValue);
            if (!Number.isFinite(target)) return;

            const obj = { val: 0 };
            gsap.to(obj, {
              val: target,
              duration: 2,
              ease: "power2.out",
              // Update DOM directly — avoid setState on every GSAP frame (freezes the tab).
              onUpdate: () => {
                el.textContent = Math.floor(obj.val).toLocaleString();
              },
            });
          });
        },
      });

      gsap.from(section.querySelectorAll(".metric-label"), {
        opacity: 0,
        y: 20,
        stagger: 0.2,
        delay: 1.5,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: { trigger: section, start: "top 70%", once: true },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="metrics" className="w-full bg-white py-[120px] dark:bg-mm-dark-surface">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <span className="mb-4 block text-xs font-semibold uppercase tracking-[1.5px] text-mm-text-muted">
            Trusted by Thousands
          </span>
          <h2 className="text-3xl leading-tight font-bold tracking-[-1px] text-mm-text sm:text-4xl lg:text-[48px] lg:leading-[56px] dark:text-white">
            The Numbers Speak
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
          {metrics.map((metric) => (
            <div key={metric.label} className="text-center">
              <span
                data-metric-value={metric.value}
                className="text-4xl font-extrabold tracking-[-2px] sm:text-5xl lg:text-[56px]"
                style={{ color: metric.color }}
              >
                0
              </span>
              <p className="metric-label mt-3 text-base text-mm-text-secondary dark:text-gray-400">
                {metric.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
