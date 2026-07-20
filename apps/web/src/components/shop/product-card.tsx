"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { ProductDto } from "@cardverse/shared";
import { formatBaht } from "@/lib/format";

gsap.registerPlugin(useGSAP);

const TILT_DEG = 12;
const HOVER_SCALE = 1.03;
const PERSPECTIVE = 800;

export function ProductCard({ product }: { product: ProductDto }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    (_, contextSafe) => {
      const card = cardRef.current;
      const inner = innerRef.current;
      if (!card || !inner || !contextSafe) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const reset = contextSafe(() => {
        gsap.to(inner, {
          rotateX: 0,
          rotateY: 0,
          scale: 1,
          duration: 0.55,
          ease: "power3.out",
        });
      });

      const onMove = contextSafe((event: MouseEvent) => {
        const rect = inner.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rx = ((y - cy) / cy) * -TILT_DEG;
        const ry = ((x - cx) / cx) * TILT_DEG;

        gsap.to(inner, {
          rotateX: rx,
          rotateY: ry,
          scale: HOVER_SCALE,
          transformPerspective: PERSPECTIVE,
          duration: 0.35,
          ease: "power2.out",
        });
      });

      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", reset);

      return () => {
        card.removeEventListener("mousemove", onMove);
        card.removeEventListener("mouseleave", reset);
      };
    },
    { scope: cardRef, dependencies: [product.id] },
  );

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div ref={cardRef}>
        <div ref={innerRef}>
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-ink/5">
            {product.imageUrl && (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
              />
            )}
            {product.isPreOrder && (
              <span className="absolute left-2 top-2 rounded bg-ink/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                PRE-ORDER
              </span>
            )}
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-medium text-ink">{product.name}</h3>
            {product.subtitle && (
              <p className="text-xs text-ink/50">{product.subtitle}</p>
            )}
            <p className="mt-1 text-sm price">{formatBaht(product.price)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
