import { Injectable } from "@nestjs/common";
import type { Role } from "@cardverse/shared";
import { PrismaService } from "../prisma/prisma.service";
import { MarketplaceOrdersService } from "../marketplace/marketplace-orders.service";
import { toBaht, toSatang } from "../common/serializers";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly marketplaceOrders: MarketplaceOrdersService,
  ) {}

  // --- Products (manager) ---
  async listProducts() {
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { catalogItem: { include: { category: true } } },
    });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      price: toBaht(p.price),
      stock: p.stock,
      soldCount: p.soldCount,
      category: p.catalogItem?.category?.name ?? null,
    }));
  }

  async createProduct(data: any) {
    const slug = data.slug ?? data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return this.prisma.product.create({
      data: {
        slug,
        name: data.name,
        subtitle: data.subtitle,
        description: data.description,
        type: data.type ?? "SINGLE_CARD",
        price: toSatang(Number(data.price)),
        stock: Number(data.stock ?? 0),
        imageUrl: data.imageUrl,
        images: data.images ?? [],
        rarity: data.rarity,
        catalogItemId: data.catalogItemId,
        isTrending: data.isTrending ?? false,
        isNewArrival: data.isNewArrival ?? false,
        isPreOrder: data.isPreOrder ?? false,
        isFeatured: data.isFeatured ?? false,
      },
    });
  }

  async updateProduct(id: string, data: any) {
    const patch: any = { ...data };
    if (data.price != null) patch.price = toSatang(Number(data.price));
    return this.prisma.product.update({ where: { id }, data: patch });
  }

  async deleteProduct(id: string) {
    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }

  async createCatalogItem(data: any): Promise<any> {
    const slug = data.slug ?? data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return this.prisma.catalogItem.create({
      data: {
        slug,
        name: data.name,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
        brandId: data.brandId,
        setId: data.setId,
        rarity: data.rarity,
        cardNumber: data.cardNumber,
        imageUrl: data.imageUrl,
        images: data.images ?? [],
      },
    });
  }

  // --- Orders + moderation (manager) ---
  async listShopOrders() {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: true, shipment: true },
    });
    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customer: o.user.displayName,
      total: toBaht(o.total),
      status: o.status,
      shipped: Boolean(o.shipment?.trackingNumber),
      createdAt: o.createdAt.toISOString(),
    }));
  }

  async suspendListing(id: string) {
    await this.prisma.listing.update({ where: { id }, data: { status: "SUSPENDED" } });
    return { ok: true };
  }

  async listDisputes(): Promise<any[]> {
    return this.prisma.marketplaceOrder.findMany({
      where: { status: "DISPUTED" },
      include: { listing: { include: { catalogItem: true } }, buyer: true, seller: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  // --- Admin only ---
  async listUsers() {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      sellerRating: u.sellerRating,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  async setUserRole(userId: string, role: Role) {
    await this.prisma.user.update({ where: { id: userId }, data: { role } });
    return { ok: true };
  }

  async refundMarketplaceOrder(orderId: string) {
    return this.marketplaceOrders.refund(orderId);
  }

  async getSettings() {
    const settings = await this.prisma.platformSetting.findMany();
    const map: Record<string, unknown> = {
      feePercent: Number(process.env.MARKETPLACE_FEE_PERCENT ?? 8),
      escrowAutoReleaseDays: Number(process.env.ESCROW_AUTO_RELEASE_DAYS ?? 7),
    };
    for (const s of settings) map[s.key] = s.value;
    return map;
  }

  async setSetting(key: string, value: unknown) {
    await this.prisma.platformSetting.upsert({
      where: { key },
      update: { value: value as any },
      create: { key, value: value as any },
    });
    return { ok: true };
  }

  async reports() {
    const [orders, revenue, marketplaceVolume, users, listings] = await Promise.all([
      this.prisma.order.count({ where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } } }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
      }),
      this.prisma.marketplaceOrder.aggregate({
        _sum: { platformFee: true },
        where: { status: "COMPLETED" },
      }),
      this.prisma.user.count(),
      this.prisma.listing.count({ where: { status: "ACTIVE" } }),
    ]);
    return {
      paidOrders: orders,
      shopRevenue: toBaht(revenue._sum.total ?? 0),
      marketplaceFeeRevenue: toBaht(marketplaceVolume._sum.platformFee ?? 0),
      users,
      activeListings: listings,
    };
  }
}
