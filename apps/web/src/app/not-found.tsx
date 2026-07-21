import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search, ShoppingBag } from "lucide-react";
import type { ProductDto } from "@cardverse/shared";
import { fetchPublicOrNull } from "@/lib/api-client/server";
import { formatBaht } from "@/lib/format";
import { NotFoundSearch } from "@/components/not-found-search";

interface HomePayload {
  categories: { id: string; slug: string; name: string; nameTh: string; emoji: string }[];
  trending: ProductDto[];
  newArrival: ProductDto[];
  featured: ProductDto[];
  topSelling: ProductDto[];
}

const FALLBACK_CATEGORIES = [
  { href: "/shop?sort=newest", label: "สินค้าใหม่", image: null, emoji: "✨" },
  { href: "/shop?sort=popular", label: "ขายดี", image: null, emoji: "🔥" },
  { href: "/marketplace", label: "Marketplace", image: null, emoji: "🃏" },
  { href: "/news", label: "ข่าว & อีเวนต์", image: null, emoji: "📰" },
] as const;

function FourOhFourBag() {
  return (
    <svg
      viewBox="0 0 160 140"
      className="mx-auto h-28 w-32 text-gold/35 sm:h-32 sm:w-36"
      fill="none"
      aria-hidden
    >
      <path
        d="M40 48h80l8 72H32l8-72z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path
        d="M55 48c0-14 10-26 25-26s25 12 25 26"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <text
        x="80"
        y="98"
        textAnchor="middle"
        className="fill-gold"
        style={{ fontSize: 36, fontWeight: 700, fontFamily: "Georgia, serif" }}
      >
        404
      </text>
    </svg>
  );
}

export default async function NotFound() {
  let home: HomePayload | null = null;
  try {
    home = await fetchPublicOrNull<HomePayload>("/home");
  } catch {
    home = null;
  }

  const trending = home?.trending?.length
    ? home.trending
    : home?.topSelling?.length
      ? home.topSelling
      : home?.featured ?? [];
  const featured = trending[0] ?? home?.featured?.[0] ?? null;
  const sideProducts = trending.slice(1, 4);

  const categoryCards = (home?.categories?.slice(0, 4) ?? []).map((c, i) => {
    const productImg =
      home?.trending?.[i]?.imageUrl ??
      home?.newArrival?.[i]?.imageUrl ??
      home?.featured?.[i]?.imageUrl ??
      null;
    return {
      href: `/shop?category=${c.slug}`,
      label: c.nameTh || c.name,
      image: productImg,
      emoji: c.emoji || "🃏",
    };
  });

  const popular =
    categoryCards.length >= 4
      ? categoryCards
      : FALLBACK_CATEGORIES.map((c, i) => ({
          ...c,
          image: categoryCards[i]?.image ?? null,
        }));

  return (
    <div className="relative overflow-hidden bg-cream">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(200,150,30,0.18), transparent), radial-gradient(circle at 100% 40%, rgba(15,27,45,0.04), transparent)",
        }}
      />

      <div className="container-page relative py-12 sm:py-16">
        {/* Hero */}
        <section className="mx-auto max-w-2xl text-center">
          <FourOhFourBag />
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Looking for something else?
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink/55 sm:text-base">
            ไม่พบหน้าที่คุณกำลังมองหา อาจถูกย้ายหรือไม่มีอยู่แล้ว
            ลองค้นหา หรือเลือกดูสินค้าแนะนำด้านล่าง
          </p>

          <div className="mt-8">
            <NotFoundSearch />
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/shop"
              className="inline-flex min-w-[160px] items-center justify-center rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gold-light"
            >
              Continue Shopping
            </Link>
            <Link
              href="/shop?sort=newest"
              className="inline-flex min-w-[160px] items-center justify-center rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink-700"
            >
              View New Arrivals
            </Link>
          </div>
        </section>

        {/* Popular Categories */}
        <section className="mt-16 sm:mt-20">
          <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">
            Popular Categories
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {popular.map((cat) => (
              <Link
                key={cat.href + cat.label}
                href={cat.href}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink/10 ring-1 ring-ink/10"
              >
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.label}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-ink/80 to-ink text-4xl">
                    {cat.emoji}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" />
                <span className="absolute bottom-3 left-3 flex items-center gap-1.5 text-sm font-semibold text-white">
                  {cat.label}
                  <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Trending Now */}
        <section className="mt-14 sm:mt-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">
              Trending Now
            </h2>
            <Link
              href="/shop?sort=popular"
              className="shrink-0 text-sm font-semibold text-gold hover:text-gold-light"
            >
              See all trending items
            </Link>
          </div>

          {featured ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
              <Link
                href={`/shop/${featured.slug}`}
                className="group card relative overflow-hidden p-0 transition hover:shadow-md"
              >
                <div className="relative aspect-[16/11] bg-ink/5 sm:aspect-[16/10]">
                  {featured.imageUrl && (
                    <Image
                      src={featured.imageUrl}
                      alt={featured.name}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-[1.02]"
                      unoptimized
                    />
                  )}
                  <span className="absolute left-3 top-3 rounded-md bg-gold px-2.5 py-1 text-[10px] font-bold tracking-wider text-white uppercase">
                    Top Choice
                  </span>
                </div>
                <div className="flex items-end justify-between gap-3 p-5">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{featured.name}</p>
                    <p className="mt-1 line-clamp-1 text-sm text-ink/50">
                      {featured.subtitle ?? featured.catalogItem?.setName ?? "Cardverse pick"}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-gold">
                      {formatBaht(featured.price)}
                    </p>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-white transition group-hover:bg-gold-light">
                    <ShoppingBag size={18} />
                  </span>
                </div>
              </Link>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-[1fr_1fr]">
                {sideProducts[0] && (
                  <ProductRow product={sideProducts[0]} wide />
                )}
                <div className="grid grid-cols-2 gap-4 sm:col-span-2 lg:col-span-1 lg:grid-cols-2">
                  {sideProducts[1] && <ProductTile product={sideProducts[1]} />}
                  {sideProducts[2] ? (
                    <ProductTile product={sideProducts[2]} />
                  ) : (
                    <Link
                      href="/marketplace"
                      className="card flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gold/10 to-ink/5 p-4 text-center transition hover:shadow-md"
                    >
                      <Search size={28} className="text-gold/60" />
                      <p className="text-sm font-semibold text-ink">Marketplace</p>
                      <p className="text-xs text-ink/45">ค้นหาการ์ดต่อได้ที่นี่</p>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card mt-5 flex flex-col items-center gap-4 py-14 text-center">
              <p className="text-sm text-ink/50">ยังไม่มีสินค้าแนะนำในตอนนี้</p>
              <Link href="/shop" className="btn-gold">
                ไปที่ Shop
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ProductRow({ product, wide }: { product: ProductDto; wide?: boolean }) {
  return (
    <Link
      href={`/shop/${product.slug}`}
      className={`card group flex items-center gap-4 p-3 transition hover:shadow-md ${wide ? "" : ""}`}
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-ink/5 sm:h-28 sm:w-28">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            unoptimized
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{product.name}</p>
        <p className="mt-1 text-sm font-semibold text-gold">{formatBaht(product.price)}</p>
      </div>
    </Link>
  );
}

function ProductTile({ product }: { product: ProductDto }) {
  return (
    <Link
      href={`/shop/${product.slug}`}
      className="card group overflow-hidden p-0 transition hover:shadow-md"
    >
      <div className="relative aspect-square bg-ink/5">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            unoptimized
          />
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
        <p className="mt-1 text-sm font-semibold text-gold">{formatBaht(product.price)}</p>
      </div>
    </Link>
  );
}
