"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductDto } from "@cardverse/shared";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { ProductCard } from "@/components/product-card";
import { SectionHeader } from "@/components/section";

interface HomePayload {
  categories: { id: string; slug: string; name: string; nameTh: string; emoji: string }[];
  trending: ProductDto[];
  newArrival: ProductDto[];
  preOrder: ProductDto[];
  featured: ProductDto[];
}

// Static hero slides — no backend table for these yet, so they live here.
// To add/change a slide, just edit this array.
interface HeroSlide {
  imageUrl: string;
  presentsKey: string;
  titleKey: string;
  subtitleKey: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    imageUrl: "https://picsum.photos/seed/cardverse-hero/1400/600",
    presentsKey: "home.presents",
    titleKey: "home.title",
    subtitleKey: "home.subtitle",
  },
  {
    imageUrl: "https://picsum.photos/seed/cardverse-hero-2/1400/600",
    presentsKey: "home.presents",
    titleKey: "home.heroTitle2",
    subtitleKey: "home.heroSubtitle2",
  },
  {
    imageUrl: "https://picsum.photos/seed/cardverse-hero-3/1400/600",
    presentsKey: "home.presents",
    titleKey: "home.heroTitle3",
    subtitleKey: "home.heroSubtitle3",
  },
];

const AUTO_SLIDE_MS = 6000;

export default function HomePage() {
  const { t, locale } = useI18n();
  const { data } = useQuery({
    queryKey: ["home"],
    queryFn: () => api.get<HomePayload>("/home"),
  });

  const [slideIndex, setSlideIndex] = useState(0);

  const goPrev = () =>
    setSlideIndex((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const goNext = () => setSlideIndex((i) => (i + 1) % HERO_SLIDES.length);

  // Auto-advance the hero, pausing is not implemented since slides are
  // decorative; resets the timer whenever the user manually navigates.
  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(id);
  }, [slideIndex]);

  const slide = HERO_SLIDES[slideIndex];

  return (
    <div className="container-page py-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-ink-900 text-white">
        <Image
          key={slide.imageUrl}
          src={slide.imageUrl}
          alt="hero"
          fill
          className="object-cover opacity-40 transition-opacity duration-500"
          priority
        />
        <div className="relative flex flex-col items-center justify-center px-6 py-20 text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-white/70">
            {t(slide.presentsKey)}
          </p>
          <h1 className="mt-3 font-display text-5xl font-semibold md:text-6xl">
            {t(slide.titleKey)}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/80">{t(slide.subtitleKey)}</p>
          <Link href="/shop" className="btn-gold mt-6">
            {t("home.shopNow")}
          </Link>
        </div>
        <button
          type="button"
          aria-label="Previous slide"
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20"
        >
          <ChevronRight size={18} />
        </button>
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {HERO_SLIDES.map((s, i) => (
            <button
              key={s.imageUrl}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setSlideIndex(i)}
              className={`h-1.5 w-6 rounded-full transition ${
                i === slideIndex ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Choose your universe */}
      <section className="py-12 text-center">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          {t("home.chooseUniverse")}
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {(data?.categories ?? []).slice(0, 4).map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className="card group overflow-hidden p-3"
            >
              <div className="relative aspect-square overflow-hidden rounded-md bg-ink/5">
                <Image
                  src={`https://picsum.photos/seed/${c.slug}/400/400`}
                  alt={c.name}
                  fill
                  className="object-cover transition group-hover:scale-105"
                />
              </div>
              <p className="mt-3 text-sm font-medium">
                {c.emoji} {locale === "th" ? c.nameTh : c.name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <ProductRow title={t("home.featured")} href="/shop?sort=popular" products={data?.featured} />
      <ProductRow title={t("home.trending")} href="/shop?sort=popular" products={data?.trending} />
      <ProductRow title={t("home.newArrival")} href="/shop" products={data?.newArrival} />
      <ProductRow title={t("home.preorder")} href="/shop" products={data?.preOrder} />
    </div>
  );
}

function ProductRow({
  title,
  href,
  products,
}: {
  title: string;
  href: string;
  products?: ProductDto[];
}) {
  if (!products?.length) return null;
  return (
    <section className="py-6">
      <SectionHeader title={title} href={href} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

