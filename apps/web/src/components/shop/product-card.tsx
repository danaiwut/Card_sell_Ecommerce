"use client";

import Link from "next/link";
import Image from "next/image";
import type { ProductDto } from "@cardverse/shared";
import { formatBaht } from "@/lib/format";
import { StarRating } from "@/components/ui/shop-ui";

export function ProductCard({ product }: { product: ProductDto }) {
  const rating = product.rating ?? null;
  const showRating = rating != null && (product.reviewCount ?? 0) > 0;

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-[20px] bg-surface">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-contain p-4 transition duration-300 group-hover:scale-105"
          />
        )}
        {product.isPreOrder && (
          <span className="absolute left-3 top-3 rounded-full bg-black px-2.5 py-1 text-[10px] font-medium text-white">
            Pre-order
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-2 text-base font-bold leading-snug">{product.name}</h3>
        {showRating && rating != null && <StarRating rating={rating} />}
        <p className="text-lg font-bold">{formatBaht(product.price)}</p>
      </div>
    </Link>
  );
}
