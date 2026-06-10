"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ShoppingCart, Send, MessageCircle } from "lucide-react";
import { useLandingCopy } from "@/hooks/useLandingCopy";
import { useLanguage } from "@/context/LanguageContext";

gsap.registerPlugin(ScrollTrigger);

const featureMeta = [
  {
    icon: ShoppingCart,
    gradient: "from-[#f0f4ff] to-white dark:from-mm-dark-elevated dark:to-mm-dark-surface",
    iconColor: "#607afb",
  },
  {
    icon: Send,
    gradient: "from-[#f0fdf4] to-white dark:from-mm-dark-elevated dark:to-mm-dark-surface",
    iconColor: "#4c9a66",
  },
  {
    icon: MessageCircle,
    gradient: "from-[#fffbeb] to-white dark:from-mm-dark-elevated dark:to-mm-dark-surface",
    iconColor: "#f59e0b",
  },
] as const;

export default function FeaturesSection() {
  const copy = useLandingCopy();
  const { language } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const heading = headingRef.current;
    const cards = cardsRef.current;
    if (!section || !heading || !cards) return;

    const titleText = copy.features.title;
    heading.textContent = titleText;

    // Подготовка букв для заголовка
    if (titleText && !heading.querySelector(".hero-char-span")) {
      heading.innerHTML = titleText
        .split("")
        .map(
          (char) =>
            `<span class="hero-char-span" style="display:inline-block;transform-origin:50% 0%">${
              char === " " ? "&nbsp;" : char
            }</span>`,
        )
        .join("");
    }

    const ctx = gsap.context(() => {
      const spans = heading.querySelectorAll(".hero-char-span");
      
      // Анимация текста
      if (spans.length > 0) {
        gsap.fromTo(spans,
          { rotateX: -90, opacity: 0 },
          {
            rotateX: 0,
            opacity: 1,
            stagger: 0.02,
            duration: 0.5,
            ease: "power2.out",
            scrollTrigger: { 
              trigger: heading,
              start: "top 90%", // Срабатывает чуть раньше
              toggleActions: "play none none none"
            },
          }
        );
      }

      // ЖЕЛЕЗОБЕТОННАЯ АНИМАЦИЯ КАРТОЧЕК через fromTo
      // Мы явно указываем начальное скрытое состояние и конечное видимое
      gsap.fromTo(cards.children,
        { 
          opacity: 0, 
          y: 60,            // Мягкое всплытие снизу
          rotateY: -15,     // Элегантный разворот боком в 3D
          transformPerspective: 1000, // Включаем 3D-глубину индивидуально для каждой карточки
        },
        {
          opacity: 1,
          y: 0,
          rotateY: 0,
          stagger: 0.12,    // Чуть ускорили поочередное появление карточек
          duration: 0.3,    // Сделали само движение более тягучим и плавным
          ease: "power2.out",
          scrollTrigger: { 
            trigger: cards,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        }
      );
    }, section);

    // Главное лекарство: даем Next.js время полностью отрендерить блоки 
    // и заставляем ScrollTrigger пересчитать карту высот страницы
    const refreshTimeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 300);

    return () => {
      clearTimeout(refreshTimeout);
      ctx.revert();
      if (heading) heading.textContent = copy.features.title;
    };
  }, [copy, language]);

  return (
    <section ref={sectionRef} id="features" className="w-full bg-white py-[120px] dark:bg-mm-dark-surface">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <span className="mb-4 block text-xs font-semibold uppercase tracking-[1.5px] text-mm-text-muted">
            {copy.features.eyebrow}
          </span>
          <h2
            key={language}
            ref={headingRef}
            className="text-3xl leading-tight font-bold tracking-[-1px] text-mm-text sm:text-4xl lg:text-[48px] lg:leading-[56px] dark:text-white"
          >
            {copy.features.title}
          </h2>
        </div>

        {/* Убрали лишние 3D свойства из классов, чтобы избежать конфликтов наложения слоев в Chrome */}
        <div ref={cardsRef} className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {copy.features.items.map((feature, i) => {
            const meta = featureMeta[i] ?? featureMeta[0];
            const Icon = meta.icon;
            return (
              <div
                key={feature.title}
                className={`group relative rounded-[20px] border border-black/[0.06] bg-gradient-to-b p-10 transition-all duration-500 hover:-translate-y-2 hover:shadow-card-hover sm:p-12 dark:border-white/[0.06] ${meta.gradient}`}
              >
                <Icon size={48} style={{ color: meta.iconColor }} className="mb-6" />
                <h3 className="mb-4 text-xl font-semibold text-mm-text sm:text-2xl dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-[24px] text-mm-text-secondary dark:text-gray-400">
                  {feature.description}
                </p>
                <div
                  className="pointer-events-none absolute inset-0 rounded-[20px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ boxShadow: `0 0 60px ${meta.iconColor}15` }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
