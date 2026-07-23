"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

function formatStat(value: number, suffix = "+"): string {
  if (value >= 1000) return `${Math.floor(value / 1000)}k${suffix}`;
  return `${value}${suffix}`;
}

interface HomeHeroProps {
  subtitle: string;
  stats: { brandCount: number; productCount: number; customerCount: number };
}

export function HomeHero({ subtitle, stats }: HomeHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".hero-title", { y: 48, opacity: 0, duration: 0.8 })
        .from(".hero-subtitle", { y: 24, opacity: 0, duration: 0.6 }, "-=0.4")
        .from(".hero-cta", { y: 16, opacity: 0, duration: 0.5 }, "-=0.3")
        .from(".hero-stat", { y: 20, opacity: 0, duration: 0.5, stagger: 0.12 }, "-=0.2")
        .from(".hero-image", { x: 40, opacity: 0, duration: 0.9 }, "-=0.6");

      sectionRef.current?.querySelectorAll(".hero-stat-value").forEach((el) => {
        const target = Number((el as HTMLElement).dataset.target ?? 0);
        const counter = { val: 0 };
        gsap.to(counter, {
          val: target,
          duration: 1.4,
          delay: 0.5,
          ease: "power2.out",
          onUpdate: () => {
            (el as HTMLElement).textContent = formatStat(Math.round(counter.val));
          },
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="container-page grid items-center gap-10 py-10 lg:grid-cols-2 lg:py-16">
      <div>
        <h1 className="hero-title text-[36px] font-black uppercase leading-[1.05] tracking-tight sm:text-[48px] lg:text-[64px]">
          Find cards that match your style
        </h1>
        <p className="hero-subtitle mt-4 max-w-lg text-base text-black/50">
          {subtitle} — sealed products, singles, and marketplace listings from trusted sellers.
        </p>
        <Link href="/shop" className="hero-cta btn-primary mt-8 inline-flex px-10">
          Shop Now
        </Link>
        <div className="mt-10 grid grid-cols-3 gap-4 border-t border-black/10 pt-8">
          <div className="hero-stat">
            <p className="hero-stat-value text-2xl font-bold sm:text-3xl" data-target={stats.brandCount}>
              0
            </p>
            <p className="mt-1 text-xs text-black/50 sm:text-sm">International Brands</p>
          </div>
          <div className="hero-stat">
            <p className="hero-stat-value text-2xl font-bold sm:text-3xl" data-target={stats.productCount}>
              0
            </p>
            <p className="mt-1 text-xs text-black/50 sm:text-sm">High-Quality Products</p>
          </div>
          <div className="hero-stat">
            <p className="hero-stat-value text-2xl font-bold sm:text-3xl" data-target={stats.customerCount}>
              0
            </p>
            <p className="mt-1 text-xs text-black/50 sm:text-sm">Happy Customers</p>
          </div>
        </div>
      </div>
      <div className="hero-image relative aspect-[4/5] overflow-hidden rounded-[20px] bg-surface lg:aspect-square">
        <Image
          src="https://picsum.photos/seed/cardverse-hero/800/1000"
          alt="Hero"
          fill
          className="object-cover"
          priority
          unoptimized
        />
      </div>
    </section>
  );
}

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedSection({ children, className }: AnimatedSectionProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced || !ref.current) return;

      gsap.from(ref.current.children, {
        y: 32,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          once: true,
        },
      });
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className={className}>
      {children}
    </section>
  );
}

interface TestimonialsProps {
  items: { name: string; text: string; rating: number }[];
}

export function HomeTestimonials({ items }: TestimonialsProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced || !ref.current) return;

      gsap.from(".testimonial-card", {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          once: true,
        },
      });
    },
    { scope: ref },
  );

  if (items.length === 0) return null;

  return (
    <div ref={ref} className="grid gap-4 md:grid-cols-3">
      {items.slice(0, 3).map((item) => (
        <div key={item.name + item.text.slice(0, 20)} className="testimonial-card rounded-[20px] border border-black/10 p-6">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={i < Math.round(item.rating) ? "text-amber-400" : "text-black/10"}>
                ★
              </span>
            ))}
          </div>
          <p className="mt-4 font-bold">{item.name} ✓</p>
          <p className="mt-2 text-sm leading-relaxed text-black/60">&ldquo;{item.text}&rdquo;</p>
        </div>
      ))}
    </div>
  );
}
