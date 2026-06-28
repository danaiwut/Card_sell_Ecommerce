import { Injectable, NotFoundException } from "@nestjs/common";
import type { ShopQuery } from "@cardverse/shared";
import { PrismaService } from "../prisma/prisma.service";
import { serializeProduct, toSatang, catalogItemInclude } from "../common/serializers";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async shop(query: ShopQuery) {
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
      items: items.map(serializeProduct),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async detail(slug: string) {
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
      product: serializeProduct(product),
      releaseDate: product.catalogItem?.releaseDate ?? null,
      description: product.description,
      related: related.map(serializeProduct),
    };
  }

  async home() {
    const [trending, newArrival, preOrder, featured] = await Promise.all([
      this.products({ isTrending: true }),
      this.products({ isNewArrival: true }),
      this.products({ isPreOrder: true }),
      this.products({ isFeatured: true }),
    ]);
    const categories = await this.prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      take: 8,
    });
    return {
      categories: categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        nameTh: c.nameTh,
        emoji: c.emoji,
      })),
      trending,
      newArrival,
      preOrder,
      featured,
    };
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
