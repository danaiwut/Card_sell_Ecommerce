import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { createResponseCache } from "../common/response-cache";
import {
  catalogItemInclude,
  serializeCatalogItem,
  serializeCategory,
} from "../common/serializers";

const categoriesCache = createResponseCache<unknown[]>(120_000);

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    return categoriesCache.get(async () => {
      const categories = await this.prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
        include: { subcategories: { orderBy: { name: "asc" } } },
      });
      return categories.map((c) => ({
        ...serializeCategory(c),
        note: c.note,
        subcategories: c.subcategories.map((s) => ({ id: s.id, slug: s.slug, name: s.name })),
      }));
    });
  }

  /** Catalog items sellers can choose from when creating a listing. */
  async searchCatalogItems(params: {
    q?: string;
    category?: string;
    page: number;
    pageSize: number;
  }) {
    const where: any = {};
    if (params.category) where.category = { slug: params.category };
    if (params.q) where.name = { contains: params.q, mode: "insensitive" };

    const [items, total] = await Promise.all([
      this.prisma.catalogItem.findMany({
        where,
        include: catalogItemInclude,
        orderBy: { name: "asc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.catalogItem.count({ where }),
    ]);

    return {
      items: items.map(serializeCatalogItem),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.ceil(total / params.pageSize),
    };
  }

  async getCatalogItem(slugOrId: string) {
    const item = await this.prisma.catalogItem.findFirst({
      where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
      include: catalogItemInclude,
    });
    if (!item) throw new NotFoundException("Catalog item not found");
    return serializeCatalogItem(item);
  }
}
