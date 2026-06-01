"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FileText, MailOpen, MessageSquare, Package } from "lucide-react";
gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    icon: FileText,
    step: "01",
    title: "Describe Your Request",
    description:
      "Choose a category, set your budget, specify quantity, and detail exactly what you need.",
  },
  {
    icon: MailOpen,
    step: "02",
    title: "Receive Seller Offers",
    description:
      "Sellers see your request in real-time and send competitive offers with their best prices and conditions.",
  },
  {
    icon: MessageSquare,
    step: "03",
    title: "Choose & Chat",
    description:
      "Compare all offers side by side, pick the best one, and open a chat to clarify details and negotiate.",
  },
  {
    icon: Package,
    step: "04",
    title: "Place Order & Track",
    description:
      "Confirm the deal, place your order, and track delivery status from processing to your doorstep.",
  },
];

export default function BuyerSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stepsEl = stepsRef.current;
    if (!section || !stepsEl) return;

    const ctx = gsap.context(() => {
      gsap.from(stepsEl.querySelectorAll(".step-card"), {
        x: -80,
        opacity: 0,
        stagger: 0.2,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 60%" },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="buyers" className="w-full bg-white py-[120px] dark:bg-mm-dark-surface">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-12 lg:flex-row lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:w-[40%]">
            <span className="mb-4 block text-xs font-semibold uppercase tracking-[1.5px] text-mm-text-muted">
              For Buyers
            </span>
            <h2 className="mb-6 text-3xl leading-tight font-bold tracking-[-1px] text-mm-text sm:text-4xl lg:text-[48px] lg:leading-[56px] dark:text-white">
              How It Works
              <br />
              For Buyers
            </h2>
            <p className="mb-8 text-base leading-[26px] text-mm-text-secondary dark:text-gray-400">
              Don&apos;t search for products — describe your task and let sellers compete to win your
              business. Four simple steps to get exactly what you need.
            </p>
            <Link
              href="/create-product-request"
              className="inline-block rounded-[10px] bg-mm-primary px-8 py-3.5 font-semibold text-white transition-colors hover:bg-mm-primary-hover"
            >
              Post a Request
            </Link>
          </div>

          <div ref={stepsRef} className="space-y-6 lg:w-[60%]">
            {steps.map((s) => (
              <div
                key={s.step}
                className="step-card flex items-start gap-5 rounded-2xl border border-transparent bg-mm-bg p-6 transition-shadow hover:border-mm-primary/20 hover:shadow-card-hover sm:gap-6 sm:p-8 dark:bg-mm-dark-elevated"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-mm-primary/10 dark:bg-mm-primary/20">
                  <s.icon size={26} className="text-mm-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="rounded bg-mm-primary/10 px-2 py-0.5 text-xs font-bold text-mm-primary dark:bg-mm-primary/20">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-mm-text sm:text-xl dark:text-white">
                    {s.title}
                  </h3>
                  <p className="text-sm leading-[22px] text-mm-text-secondary dark:text-gray-400">
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
