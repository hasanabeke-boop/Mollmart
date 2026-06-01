"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    name: "Sarah K.",
    role: "Procurement Manager",
    avatar: "SK",
    bg: "#e2e8f0",
    text: "We cut our supplier search time by 70%. Posting one request brought us 12 competitive offers in under 24 hours.",
  },
  {
    name: "Marcus T.",
    role: "Handmade Seller",
    avatar: "MT",
    bg: "#dbeafe",
    text: "I used to guess what customers wanted. Now I see live demand and send offers directly. My sales doubled in two months.",
  },
  {
    name: "Elena R.",
    role: "Small Business Owner",
    avatar: "ER",
    bg: "#dcfce7",
    text: "The dual account is genius. I buy supplies as a buyer in the morning and sell my products as a seller in the afternoon. One platform, zero friction.",
  },
];

export default function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const cards = cardsRef.current;
    if (!section || !cards) return;

    const ctx = gsap.context(() => {
      gsap.from(cards.children, {
        y: 60,
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
    <section ref={sectionRef} id="testimonials" className="w-full bg-mm-bg py-[120px] dark:bg-mm-dark-bg">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <span className="mb-4 block text-xs font-semibold uppercase tracking-[1.5px] text-mm-text-muted">
            Testimonials
          </span>
          <h2 className="text-3xl leading-tight font-bold tracking-[-1px] text-mm-text sm:text-4xl lg:text-[48px] lg:leading-[56px] dark:text-white">
            What Our Users Say
          </h2>
        </div>

        <div ref={cardsRef} className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border-l-4 border-mm-primary bg-mm-surface p-8 shadow-card transition-shadow hover:shadow-card-hover sm:p-10 dark:bg-mm-dark-elevated"
            >
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-mm-text"
                  style={{ background: t.bg }}
                >
                  {t.avatar}
                </div>
                <div>
                  <h4 className="text-base font-semibold text-mm-text dark:text-white">{t.name}</h4>
                  <p className="text-xs text-mm-text-muted">{t.role}</p>
                </div>
              </div>
              <p className="text-base leading-[26px] text-mm-text-secondary italic dark:text-gray-400">
                &ldquo;{t.text}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
