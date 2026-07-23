"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ProductDto } from "@cardverse/shared";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { ProductCard } from "@/components/product-card";
import { SectionHeader } from "@/components/section";
import { AnimatedSection, HomeHero, HomeTestimonials } from "@/components/home/home-animations";

interface HomePayload {
  categories: { id: string; slug: string; name: string; nameTh: string; emoji: string }[];
  stats: { brandCount: number; productCount: number; customerCount: number };
  brands: string[];
  testimonials: { name: string; text: string; rating: number }[];
  trending: ProductDto[];
  newArrival: ProductDto[];
  preOrder: ProductDto[];
  featured: ProductDto[];
  topExpensive: ProductDto[];
  topSelling: ProductDto[];
}

export default function HomePage() {
  const { t, locale } = useI18n();
  const { data } = useQuery({
    queryKey: ["home"],
    queryFn: () => api.get<HomePayload>("/home"),
  });

  const stats = data?.stats ?? { brandCount: 0, productCount: 0, customerCount: 0 };
  const brands = data?.brands ?? [];

  return (
    <div>
      <HomeHero subtitle={t("home.subtitle")} stats={stats} />

      {brands.length > 0 && (
        <section className="bg-black py-8">
          <div className="container-page flex flex-wrap items-center justify-center gap-8 sm:justify-between">
            {brands.map((brand) => (
              <span key={brand} className="text-lg font-black uppercase tracking-widest text-white/90 sm:text-xl">
                {brand}
              </span>
            ))}
          </div>
        </section>
      )}

      {(data?.newArrival?.length ?? 0) > 0 && (
        <AnimatedSection className="container-page py-14">
          <SectionHeader title="New Arrivals" href="/shop" />
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {data!.newArrival.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </AnimatedSection>
      )}

      {(data?.topSelling?.length ?? 0) > 0 && (
        <AnimatedSection className="container-page py-14">
          <SectionHeader title="Top Selling" href="/shop?sort=popular" />
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {data!.topSelling.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </AnimatedSection>
      )}

      <AnimatedSection className="container-page py-14">
        <div className="rounded-[20px] bg-surface px-6 py-10 sm:px-10 sm:py-14">
          <h2 className="section-title">Browse by category</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {(data?.categories ?? []).slice(0, 4).map((c, i) => (
              <Link
                key={c.id}
                href={`/shop?category=${c.slug}`}
                className={`relative overflow-hidden rounded-[20px] bg-white ${
                  i % 2 === 0 ? "sm:min-h-[260px]" : "sm:min-h-[200px]"
                } min-h-[180px]`}
              >
                <Image
                  src={`https://picsum.photos/seed/${c.slug}/600/400`}
                  alt={c.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute left-5 top-5 text-2xl font-bold text-white">
                  {locale === "th" ? c.nameTh : c.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <ProductRow title={t("home.featured")} href="/shop?sort=popular" products={data?.featured} />
      <ProductRow title={t("home.trending")} href="/shop?sort=popular" products={data?.trending} />

      <section className="container-page py-14">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-[32px] font-black uppercase sm:text-[48px]">Our happy customers</h2>
          <div className="hidden gap-2 sm:flex">
            <button type="button" className="rounded-full border border-black/10 p-3" aria-label="Previous">
              <ArrowLeft size={18} />
            </button>
            <button type="button" className="rounded-full border border-black/10 p-3" aria-label="Next">
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
        <HomeTestimonials items={data?.testimonials ?? []} />
      </section>
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
    <AnimatedSection className="container-page py-10">
      <SectionHeader title={title} href={href} />
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {products.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </AnimatedSection>
  );
}
