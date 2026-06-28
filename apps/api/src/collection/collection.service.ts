import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { catalogItemInclude, serializeCatalogItem } from "../common/serializers";

@Injectable()
export class CollectionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Per-category "owned / total available" overview. */
  async overview(userId: string) {
    const categories = await this.prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { catalogItems: true } } },
    });

    const owned = await this.prisma.collectionItem.findMany({
      where: { userId },
      include: { catalogItem: { select: { categoryId: true } } },
    });
    const ownedByCategory = new Map<string, number>();
    for (const item of owned) {
      const cid = item.catalogItem.categoryId;
      ownedByCategory.set(cid, (ownedByCategory.get(cid) ?? 0) + 1);
    }

    return categories
      .map((c) => {
        const total = c._count.catalogItems;
        const have = ownedByCategory.get(c.id) ?? 0;
        return {
          id: c.id,
          slug: c.slug,
          name: c.name,
          nameTh: c.nameTh,
          emoji: c.emoji,
          owned: have,
          total,
          percent: total ? Math.round((have / total) * 100) : 0,
        };
      })
      .filter((c) => c.total > 0);
  }

  async myCards(userId: string) {
    const items = await this.prisma.collectionItem.findMany({
      where: { userId },
      include: { catalogItem: { include: catalogItemInclude } },
      orderBy: { acquiredAt: "desc" },
    });
    return items.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      acquiredAt: i.acquiredAt.toISOString(),
      catalogItem: serializeCatalogItem(i.catalogItem),
    }));
  }

  async addToCollection(userId: string, catalogItemId: string) {
    await this.prisma.collectionItem.upsert({
      where: { userId_catalogItemId: { userId, catalogItemId } },
      update: { quantity: { increment: 1 } },
      create: { userId, catalogItemId },
    });
    return { ok: true };
  }

  // --- Wishlist ---
  async wishlist(userId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      include: { catalogItem: { include: catalogItemInclude } },
      orderBy: { createdAt: "desc" },
    });
    return items.map((i) => ({ id: i.id, catalogItem: serializeCatalogItem(i.catalogItem) }));
  }

  async toggleWishlist(userId: string, catalogItemId: string) {
    const existing = await this.prisma.wishlistItem.findUnique({
      where: { userId_catalogItemId: { userId, catalogItemId } },
    });
    if (existing) {
      await this.prisma.wishlistItem.delete({ where: { id: existing.id } });
      return { wishlisted: false };
    }
    await this.prisma.wishlistItem.create({ data: { userId, catalogItemId } });
    return { wishlisted: true };
  }
}
