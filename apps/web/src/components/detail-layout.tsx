import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/format";

export function DetailBreadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-ink/50">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={12} className="text-ink/30" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink/70">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function SpecTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white px-3 py-3 text-center shadow-card">
      <p className="text-[10px] font-semibold tracking-wider text-ink/45">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

export function VerifiedBadge({ label = "VERIFIED AUTHENTIC CARDVERSE ITEM" }: { label?: string }) {
  return (
    <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-gold">
      <ShieldCheck size={14} />
      {label}
    </p>
  );
}

export function DetailTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-1 border-b border-ink/10">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "px-4 py-2.5 text-sm font-medium transition",
            active === tab
              ? "border-b-2 border-gold text-ink"
              : "text-ink/50 hover:text-ink",
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export function TrustBadges() {
  const items = [
    { label: "Insured Shipping", sub: "จัดส่งประกันภัย" },
    { label: "Authentic Guarantee", sub: "ของแท้รับประกัน" },
    { label: "Secure Checkout", sub: "ชำระเงินปลอดภัย" },
  ];
  return (
    <div className="mt-6 grid grid-cols-3 gap-3 text-center">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-ink/10 bg-white px-2 py-3">
          <p className="text-[10px] font-semibold tracking-wide text-ink/70">{item.label}</p>
          <p className="mt-0.5 text-[10px] text-ink/40">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}

export function RelatedSectionHeader({
  title,
  subtitle,
  href,
  linkLabel,
}: {
  title: string;
  subtitle: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-ink/50">{subtitle}</p>
      </div>
      <Link href={href} className="flex items-center gap-1 text-sm font-medium text-gold hover:underline">
        {linkLabel}
        <ChevronRight size={14} />
      </Link>
    </div>
  );
}

export function RelatedCatalogCard({
  href,
  name,
  imageUrl,
  meta,
  price,
  badge,
}: {
  href: string;
  name: string;
  imageUrl: string | null;
  meta: string;
  price?: string;
  badge?: string;
}) {
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-ink/5 ring-1 ring-ink/10">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, 20vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        )}
        {badge && (
          <span className="absolute right-2 top-2 rounded bg-ink/80 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white">
            {badge}
          </span>
        )}
        {price && (
          <span className="absolute bottom-2 right-2 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-ink shadow-sm">
            {price}
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold text-ink group-hover:text-gold">{name}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-ink/45">{meta}</p>
    </Link>
  );
}

export function RarityRibbon({ label }: { label: string }) {
  return (
    <div className="absolute right-0 top-4 z-10">
      <span className="inline-block origin-top-right rotate-45 translate-x-4 bg-gold px-8 py-1 text-[10px] font-bold tracking-wider text-white shadow-sm">
        {label}
      </span>
    </div>
  );
}

export function PriceTrendBadge({ pct }: { pct: number | null }) {
  if (pct == null) return null;
  const up = pct >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600",
      )}
    >
      {up ? "+" : ""}
      {pct.toFixed(1)}% (30d)
    </span>
  );
}
