import { notFound } from "next/navigation";
import { fetchPublicOrNull } from "@/lib/api-client/server";
import {
  ProductDetailClient,
  type ProductDetailPayload,
} from "@/components/shop/product-detail-client";

export const revalidate = 60;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchPublicOrNull<ProductDetailPayload>(`/products/${slug}`, {
    tags: [`product-${slug}`],
  });

  if (!data) notFound();

  return <ProductDetailClient slug={slug} initialData={data} />;
}
