"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Crown, Flame } from "lucide-react";
import type { ProductDto } from "@cardverse/shared";
import { formatBaht } from "@/lib/format";

gsap.registerPlugin(useGSAP);

type Variant = "premium" | "bestseller";

export function PremiumProductCard({
  product,
  variant,
}: {
  product: ProductDto;
  variant: Variant;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useGSAP(
    (_, contextSafe) => {
      const wrap = wrapRef.current;
      const glow = glowRef.current;
      if (!wrap || !glow || !contextSafe) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const pulse = contextSafe(() => {
        gsap.to(glow, {
          opacity: variant === "premium" ? 0.7 : 0.55,
          scale: 1.05,
          duration: 1.8,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      });
      pulse();

      const onMove = contextSafe((e: MouseEvent) => {
        const rect = wrap.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
        gsap.to(wrap, { rotateX: y, rotateY: x, duration: 0.4, ease: "power2.out" });
      });
      const reset = contextSafe(() => {
        gsap.to(wrap, { rotateX: 0, rotateY: 0, duration: 0.6, ease: "power3.out" });
      });

      wrap.addEventListener("mousemove", onMove);
      wrap.addEventListener("mouseleave", reset);
      return () => {
        wrap.removeEventListener("mousemove", onMove);
        wrap.removeEventListener("mouseleave", reset);
      };
    },
    { scope: wrapRef, dependencies: [product.id, variant] },
  );

  const isPremium = variant === "premium";

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div
        ref={wrapRef}
        className="relative"
        style={{ perspective: 900, transformStyle: "preserve-3d" }}
      >
        <div
          ref={glowRef}
          className={`pointer-events-none absolute -inset-2 rounded-2xl blur-xl ${
            isPremium
              ? "bg-gradient-to-br from-gold/50 via-amber-300/30 to-purple-400/20"
              : "bg-gradient-to-br from-orange-400/40 via-red-400/25 to-gold/30"
          }`}
          style={{ opacity: 0.4 }}
        />
        <div
          className={`relative overflow-hidden rounded-xl border-2 bg-white shadow-lg transition group-hover:shadow-xl ${
            isPremium ? "border-gold/50" : "border-orange-400/40"
          }`}
        >
          <div className="relative aspect-[3/4] overflow-hidden bg-ink/5">
            {product.imageUrl && (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            )}
            <div
              className={`absolute left-2 top-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow ${
                isPremium ? "bg-gradient-to-r from-gold to-amber-500" : "bg-gradient-to-r from-orange-500 to-red-500"
              }`}
            >
              {isPremium ? <Crown size={10} /> : <Flame size={10} />}
              {isPremium ? "Premium" : "Best Seller"}
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
          </div>
          <div className="p-3">
            <h3 className="text-sm font-semibold text-ink">{product.name}</h3>
            {product.subtitle && (
              <p className="text-xs text-ink/50">{product.subtitle}</p>
            )}
            <p className="mt-1.5 text-base font-bold text-gold">{formatBaht(product.price)}</p>
            {product.soldCount != null && product.soldCount > 0 && (
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-ink/40">
                ขายแล้ว {product.soldCount} ชิ้น
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
