import Link from "next/link";
import Image from "next/image";
import type { ProductDto } from "@cardverse/shared";
import { formatBaht } from "@/lib/format";

export function ProductCard({ product }: { product: ProductDto }) {
  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-ink/5">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
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
    </Link>
  );
}
