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
import { PremiumProductCard } from "@/components/premium-product-card";
import { SectionHeader } from "@/components/section";

interface HomePayload {
  categories: { id: string; slug: string; name: string; nameTh: string; emoji: string }[];
  trending: ProductDto[];
  newArrival: ProductDto[];
  preOrder: ProductDto[];
  featured: ProductDto[];
  topExpensive: ProductDto[];
  topSelling: ProductDto[];
}

interface HeroSlide {
  imageUrl: string;
  overlayClass: string;
  presentsKey: string;
  titleKey: string;
  subtitleKey: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    imageUrl: "https://asia-th.onepiece-cardgame.com/onepiececg/bccard/th/products/2026/06/11/sVSGHytCNoCcaoHA/thumbnail.webp",
    overlayClass: "from-ink-900/80 via-ink-900/60 to-amber-950/50",
    presentsKey: "home.presents",
    titleKey: "home.title",
    subtitleKey: "home.subtitle",
  },
  {
    imageUrl: "https://th.portal-pokemon.com/images/ec1baaf94c00bcf35b8ca314e93c91c7.png",
    overlayClass: "from-ink-900/80 via-ink-900/60 to-rose-950/50",
    presentsKey: "home.presents",
    titleKey: "home.heroTitle2",
    subtitleKey: "home.heroSubtitle2",
  },
  {
    imageUrl: "https://static.thairath.co.th/media/dFQROr7oWzulq5Fa7HHBrYiZBNtgEO0ZF7BI6dZPJA0o0qQdIqlIqzWZ43DgDBRkYc1.jpg",
    overlayClass: "from-ink-900/80 via-ink-900/60 to-cyan-950/50",
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
  const goNext = () =>
    setSlideIndex((i) => (i + 1) % HERO_SLIDES.length);

  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(id);
  }, [slideIndex]);

  const slide = HERO_SLIDES[slideIndex];

  return (
    <div className="container-page py-6">
      {/* ─── Hero ─── */}
      <section className="relative h-[420px] overflow-hidden rounded-2xl">
        {/* Background image — เปลี่ยนตาม slide */}
        <Image
          key={slide.imageUrl}
          src={slide.imageUrl}
          alt="hero"
          fill
          className="object-cover transition-opacity duration-700"
          priority
          unoptimized
        />
        {/* Gradient overlay ทับรูป */}
        <div className={`absolute inset-0 bg-gradient-to-r ${slide.overlayClass}`} />

        {/* กริด pattern ตกแต่ง */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />

        {/* Glow spot กลาง */}
        <div className="absolute left-1/2 top-1/2 h-64 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl" />

        {/* Content */}
        <div className="relative flex h-full flex-col items-center justify-center px-6 text-center text-white">
          <p className="text-xs font-semibold tracking-[0.35em] text-gold/80 uppercase">
            {t(slide.presentsKey)}
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl md:text-5xl lg:text-6xl drop-shadow-lg">
            {t(slide.titleKey)}
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/75">
            {t(slide.subtitleKey)}
          </p>
          <Link href="/shop" className="btn-gold mt-7 shadow-lg shadow-gold/20">
            {t("home.shopNow")}
          </Link>
        </div>

        {/* ปุ่มซ้าย-ขวา */}
        <button
          type="button"
          aria-label="Previous slide"
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2.5 text-white backdrop-blur-sm hover:bg-black/50 transition"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2.5 text-white backdrop-blur-sm hover:bg-black/50 transition"
        >
          <ChevronRight size={18} />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
          {HERO_SLIDES.map((s, i) => (
            <button
              key={s.imageUrl}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setSlideIndex(i)}
              className={`rounded-full transition-all duration-300 ${
                i === slideIndex
                  ? "h-2 w-8 bg-gold"
                  : "h-2 w-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </section>

      {/* ─── Choose your universe ─── */}
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
                  src={
                    c.slug === "sports-cards" ? "/images/sports-nba-box.png" :
                    c.slug === "anime-manga"  ? "/images/naruto-box-3.jpg" :
                    c.slug === "tcg"          ? "/images/pokemon-pikachu-ex-sar-th.png" :
                    `https://picsum.photos/seed/${c.slug}/400/400`
                  }
                  alt={c.name}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                  unoptimized
                />
              </div>
              <p className="mt-3 text-sm font-medium">
                {c.emoji} {locale === "th" ? c.nameTh : c.name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Premium & Best Seller highlights */}
      {((data?.topExpensive?.length ?? 0) > 0 || (data?.topSelling?.length ?? 0) > 0) && (
        <section className="py-8">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">
              Exclusive Picks
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold">
              สินค้าพรีเมียม &amp; ขายดีสุด
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {(data?.topExpensive ?? []).map((p) => (
              <PremiumProductCard key={`exp-${p.id}`} product={p} variant="premium" />
            ))}
            {(data?.topSelling ?? []).map((p) => (
              <PremiumProductCard key={`sell-${p.id}`} product={p} variant="bestseller" />
            ))}
          </div>
        </section>
      )}

      <ProductRow title={t("home.featured")}   href="/shop?sort=popular" products={data?.featured} />
      <ProductRow title={t("home.trending")}   href="/shop?sort=popular" products={data?.trending} />
      <ProductRow title={t("home.newArrival")} href="/shop"              products={data?.newArrival} />
      <ProductRow title={t("home.preorder")}   href="/shop"              products={data?.preOrder} />
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