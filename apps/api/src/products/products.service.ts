import { Injectable, NotFoundException } from "@nestjs/common";
import type { ShopQuery } from "@cardverse/shared";
import { PrismaService } from "../prisma/prisma.service";
import { createResponseCache, createKeyedResponseCache } from "../common/response-cache";
import { serializeProduct, toSatang, catalogItemInclude } from "../common/serializers";
import { ProductReviewsService } from "./product-reviews.service";

const homeCache = createResponseCache<Record<string, unknown>>(60_000);
const shopCache = createKeyedResponseCache<Record<string, unknown>>(30_000);
const detailCache = createKeyedResponseCache<Record<string, unknown>>(60_000);

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewsService: ProductReviewsService,
  ) {}

  async shop(query: ShopQuery) {
    const cacheKey = JSON.stringify(query);
    return shopCache.get(cacheKey, async () => {
      const where: any = {};
      if (query.type) where.type = query.type;
      if (query.q) {
        where.OR = [
          { name: { contains: query.q, mode: "insensitive" } },
          { subtitle: { contains: query.q, mode: "insensitive" } },
        ];
      }
      if (query.category) where.catalogItem = { category: { slug: query.category } };
      if (query.subcategory) {
        where.catalogItem = {
          ...(where.catalogItem ?? {}),
          subcategory: { slug: query.subcategory },
        };
      }
      if (query.minPrice != null || query.maxPrice != null) {
        where.price = {};
        if (query.minPrice != null) where.price.gte = toSatang(query.minPrice);
        if (query.maxPrice != null) where.price.lte = toSatang(query.maxPrice);
      }

      const orderBy =
        query.sort === "price_asc"
          ? { price: "asc" as const }
          : query.sort === "price_desc"
            ? { price: "desc" as const }
            : query.sort === "popular"
              ? { soldCount: "desc" as const }
              : { createdAt: "desc" as const };

      const [items, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          include: { catalogItem: { include: catalogItemInclude } },
          orderBy,
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
        this.prisma.product.count({ where }),
      ]);

      return {
        items: await this.withReviewStats(items.map(serializeProduct)),
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      };
    });
  }

  async detail(slug: string) {
    return detailCache.get(slug, async () => {
      const product = await this.prisma.product.findFirst({
        where: { OR: [{ slug }, { id: slug }] },
        include: { catalogItem: { include: catalogItemInclude } },
      });
      if (!product) throw new NotFoundException("Product not found");

      const related = await this.prisma.product.findMany({
        where: { id: { not: product.id } },
        include: { catalogItem: { include: catalogItemInclude } },
        take: 5,
        orderBy: { isTrending: "desc" },
      });

      return {
        product: (await this.withReviewStats([serializeProduct(product)]))[0],
        releaseDate: product.catalogItem?.releaseDate ?? null,
        description: product.description,
        related: await this.withReviewStats(related.map(serializeProduct)),
      };
    });
  }

  async getProductReviews(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
    });
    if (!product) throw new NotFoundException("Product not found");
    return this.reviewsService.listForProduct(product.id);
  }

  async home() {
    return homeCache.get(async () => {
      const [trending, newArrival, preOrder, featured, topExpensive, topSelling] =
        await Promise.all([
          this.products({ isTrending: true }),
          this.products({ isNewArrival: true }),
          this.products({ isPreOrder: true }),
          this.products({ isFeatured: true }),
          this.topProducts({ orderBy: { price: "desc" as const }, take: 2 }),
          this.topProducts({ orderBy: { soldCount: "desc" as const }, take: 2 }),
        ]);
      const [categories, brandCount, productCount, deliveredOrders, brands, recentReviews] =
        await Promise.all([
          this.prisma.category.findMany({ orderBy: { sortOrder: "asc" }, take: 8 }),
          this.prisma.brand.count(),
          this.prisma.product.count(),
          this.prisma.order.findMany({ where: { status: "DELIVERED" }, select: { userId: true } }),
          this.prisma.brand.findMany({ orderBy: { name: "asc" }, take: 5 }),
          this.prisma.productReview.findMany({
            include: { author: true },
            orderBy: { createdAt: "desc" },
            take: 6,
            where: { comment: { not: null } },
          }),
        ]);

      const customerCount = new Set(deliveredOrders.map((o) => o.userId)).size;

      return {
        categories: categories.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          nameTh: c.nameTh,
          emoji: c.emoji,
        })),
        stats: {
          brandCount,
          productCount,
          customerCount,
        },
        brands: brands.map((b) => b.name),
        testimonials: recentReviews.map((r) => ({
          name: r.author?.displayName ?? "Customer",
          text: r.comment ?? "",
          rating: r.rating,
        })),
        trending: await this.withReviewStats(trending),
        newArrival: await this.withReviewStats(newArrival),
        preOrder: await this.withReviewStats(preOrder),
        featured: await this.withReviewStats(featured),
        topExpensive: await this.withReviewStats(topExpensive),
        topSelling: await this.withReviewStats(topSelling),
      };
    });
  }

  private async withReviewStats<T extends { id: string }>(products: T[]) {
    const stats = await this.reviewsService.statsForProducts(products.map((p) => p.id));
    return products.map((p) => {
      const s = stats.get(p.id);
      return {
        ...p,
        rating: s?.rating ?? null,
        reviewCount: s?.reviewCount ?? 0,
      };
    });
  }

  private async topProducts(opts: { orderBy: Record<string, "asc" | "desc">; take: number }) {
    const items = await this.prisma.product.findMany({
      where: { stock: { gt: 0 } },
      include: { catalogItem: { include: catalogItemInclude } },
      orderBy: opts.orderBy,
      take: opts.take,
    });
    return items.map(serializeProduct);
  }

  private async products(where: any) {
    const items = await this.prisma.product.findMany({
      where,
      include: { catalogItem: { include: catalogItemInclude } },
      take: 8,
      orderBy: { createdAt: "desc" },
    });
    return items.map(serializeProduct);
  }
}
