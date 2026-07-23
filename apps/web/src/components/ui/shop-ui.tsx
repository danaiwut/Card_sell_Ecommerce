import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";

export function StarRating({ rating = 4.5 }: { rating?: number }) {
  const full = Math.floor(rating);
  const partial = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < full
              ? "fill-amber-400 text-amber-400"
              : i === full && partial
                ? "fill-amber-400/50 text-amber-400"
                : "fill-black/10 text-black/10"
          }
        />
      ))}
      <span className="ml-1 text-xs text-black/60">{rating}/5</span>
    </div>
  );
}

export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-black/40">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={14} />}
          {item.href ? (
            <Link href={item.href} className="hover:text-black">
              {item.label}
            </Link>
          ) : (
            <span className="text-black/70">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function NewsletterBanner() {
  return (
    <section className="container-page py-12">
      <div className="flex flex-col items-center justify-between gap-6 rounded-[20px] bg-black px-6 py-10 sm:flex-row sm:px-12 sm:py-14">
        <h2 className="max-w-md text-center text-2xl font-black uppercase leading-tight text-white sm:text-left sm:text-3xl">
          Stay up to date about our latest offers
        </h2>
        <div className="flex w-full max-w-md flex-col gap-3">
          <input
            type="email"
            placeholder="Enter your email address"
            className="rounded-full border border-white/20 bg-white px-5 py-3 text-sm outline-none"
          />
          <button type="button" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black">
            Subscribe to Newsletter
          </button>
        </div>
      </div>
    </section>
  );
}

export const PRICE_RANGE_MIN = 100;
export const PRICE_RANGE_MAX = 10000;

interface PriceRangeSliderProps {
  minValue: number;
  maxValue: number;
  onChange: (min: number, max: number) => void;
}

export function PriceRangeSlider({ minValue, maxValue, onChange }: PriceRangeSliderProps) {
  const min = Math.max(PRICE_RANGE_MIN, Math.min(minValue, maxValue - 100));
  const max = Math.min(PRICE_RANGE_MAX, Math.max(maxValue, minValue + 100));
  const minPercent = ((min - PRICE_RANGE_MIN) / (PRICE_RANGE_MAX - PRICE_RANGE_MIN)) * 100;
  const maxPercent = ((max - PRICE_RANGE_MIN) / (PRICE_RANGE_MAX - PRICE_RANGE_MIN)) * 100;

  return (
    <div className="price-range mt-4">
      <div className="relative mx-1 h-6">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-black/10" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-black"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <input
          type="range"
          min={PRICE_RANGE_MIN}
          max={PRICE_RANGE_MAX}
          step={100}
          value={min}
          onChange={(e) => onChange(Math.min(Number(e.target.value), max - 100), max)}
          className="price-range-input"
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={PRICE_RANGE_MIN}
          max={PRICE_RANGE_MAX}
          step={100}
          value={max}
          onChange={(e) => onChange(min, Math.max(Number(e.target.value), min + 100))}
          className="price-range-input"
          aria-label="Maximum price"
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-black/40">
        <span>฿{PRICE_RANGE_MIN.toLocaleString()}</span>
        <span>฿{PRICE_RANGE_MAX.toLocaleString()}</span>
      </div>
    </div>
  );
}
