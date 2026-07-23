import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import type { Role } from "@cardverse/shared";
import { PrismaService } from "../prisma/prisma.service";
import { MarketplaceOrdersService } from "../marketplace/marketplace-orders.service";
import { catalogItemInclude, serializeCatalogItem, toBaht, toSatang } from "../common/serializers";
import { NewsService } from "../news/news.service";
import { ShippingService } from "../shipping/shipping.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly marketplaceOrders: MarketplaceOrdersService,
    private readonly news: NewsService,
    private readonly shipping: ShippingService,
  ) {}

  // --- Products (manager) ---
  async listProducts() {
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { catalogItem: { include: catalogItemInclude } },
    });
    return products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      subtitle: p.subtitle,
      description: p.description,
      type: p.type,
      price: toBaht(p.price),
      stock: p.stock,
      imageUrl: p.imageUrl,
      images: p.images,
      rarity: p.rarity,
      soldCount: p.soldCount,
      isPreOrder: p.isPreOrder,
      isFeatured: p.isFeatured,
      isTrending: p.isTrending,
      isNewArrival: p.isNewArrival,
      catalogItemId: p.catalogItemId,
      catalogItem: p.catalogItem ? serializeCatalogItem(p.catalogItem) : null,
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
    const item = await this.prisma.catalogItem.create({
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
      include: catalogItemInclude,
    });
    return serializeCatalogItem(item);
  }

  async catalogOptions() {
    const [categories, subcategories, brands, sets] = await Promise.all([
      this.prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
      this.prisma.subcategory.findMany({ orderBy: { name: "asc" } }),
      this.prisma.brand.findMany({ orderBy: { name: "asc" } }),
      this.prisma.cardSet.findMany({ orderBy: { name: "asc" } }),
    ]);

    return {
      categories: categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        nameTh: c.nameTh,
      })),
      subcategories: subcategories.map((s) => ({
        id: s.id,
        categoryId: s.categoryId,
        slug: s.slug,
        name: s.name,
      })),
      brands: brands.map((b) => ({
        id: b.id,
        categoryId: b.categoryId,
        slug: b.slug,
        name: b.name,
      })),
      sets: sets.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        releaseDate: s.releaseDate?.toISOString() ?? null,
      })),
    };
  }

  // --- Orders + moderation (manager) ---
  async listShopOrders() {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: true, items: true, shipment: { include: { events: true } } },
    });
    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customer: o.user.displayName,
      total: toBaht(o.total),
      status: o.status,
      shipped: Boolean(o.shipment?.trackingNumber),
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: toBaht(i.unitPrice),
      })),
      shipment: this.serializeShipment(o.shipment),
    }));
  }

  async listMarketplaceOrders() {
    const orders = await this.prisma.marketplaceOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        buyer: true,
        seller: true,
        listing: { include: { catalogItem: { include: catalogItemInclude } } },
        shipment: { include: { events: true } },
      },
    });

    return orders.map((o) => ({
      id: o.id,
      status: o.status,
      amount: toBaht(o.amount),
      platformFee: toBaht(o.platformFee),
      sellerPayout: toBaht(o.sellerPayout),
      buyer: { id: o.buyer.id, displayName: o.buyer.displayName, email: o.buyer.email },
      seller: { id: o.seller.id, displayName: o.seller.displayName, email: o.seller.email },
      listing: {
        id: o.listing.id,
        condition: o.listing.condition,
        catalogItem: serializeCatalogItem(o.listing.catalogItem),
      },
      shipment: this.serializeShipment(o.shipment),
      createdAt: o.createdAt.toISOString(),
    }));
  }

  async shippingQueue() {
    const [shopOrders, marketplaceOrders] = await Promise.all([
      this.prisma.order.findMany({
        where: { status: { in: ["PAID", "PROCESSING", "SHIPPED"] } },
        orderBy: { createdAt: "asc" },
        include: { user: true, shipment: true },
        take: 100,
      }),
      this.prisma.marketplaceOrder.findMany({
        where: { status: { in: ["PAID_HELD", "SHIPPED", "DELIVERED"] } },
        orderBy: { createdAt: "asc" },
        include: {
          buyer: true,
          seller: true,
          listing: { include: { catalogItem: true } },
          shipment: true,
        },
        take: 100,
      }),
    ]);

    return [
      ...shopOrders.map((o) => ({
        id: o.id,
        kind: "shop" as const,
        label: o.orderNumber,
        customer: o.user.displayName,
        status: o.status,
        shipmentStatus: o.shipment?.status ?? null,
        carrier: o.shipment?.carrier ?? null,
        trackingNumber: o.shipment?.trackingNumber ?? null,
        createdAt: o.createdAt.toISOString(),
      })),
      ...marketplaceOrders.map((o) => ({
        id: o.id,
        kind: "marketplace" as const,
        label: o.listing.catalogItem.name,
        customer: `${o.buyer.displayName} / ${o.seller.displayName}`,
        status: o.status,
        shipmentStatus: o.shipment?.status ?? null,
        carrier: o.shipment?.carrier ?? null,
        trackingNumber: o.shipment?.trackingNumber ?? null,
        createdAt: o.createdAt.toISOString(),
      })),
    ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async updateShipment(kind: "shop" | "marketplace", id: string, data: any) {
    if (kind === "shop") return this.shipping.updateShopShipment(id, data);
    return this.shipping.updateMarketplaceShipment(null, id, data, { skipSellerCheck: true });
  }

  async listNews(status?: "draft" | "published") {
    return this.news.listAdmin(status);
  }

  async updateNews(id: string, data: any) {
    return this.news.update(id, data);
  }

  async publishNews(id: string) {
    return this.news.publish(id);
  }

  async deleteNews(id: string) {
    return this.news.delete(id);
  }

  async suspendListing(id: string) {
    await this.prisma.listing.update({ where: { id }, data: { status: "SUSPENDED" } });
    return { ok: true };
  }

  async listActiveListings() {
    const listings = await this.prisma.listing.findMany({
      where: { status: { in: ["ACTIVE", "SOLD", "CANCELLED", "SUSPENDED"] } },
      include: {
        seller: true,
        catalogItem: { include: catalogItemInclude },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return listings.map((l) => ({
      id: l.id,
      price: toBaht(l.price),
      condition: l.condition,
      status: l.status,
      seller: { id: l.seller.id, displayName: l.seller.displayName },
      catalogItem: serializeCatalogItem(l.catalogItem),
      createdAt: l.createdAt.toISOString(),
    }));
  }

  async refundShopOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (!["PAID", "PROCESSING", "SHIPPED"].includes(order.status)) {
      throw new BadRequestException("ไม่สามารถคืนเงินคำสั่งซื้อนี้ได้");
    }
    const wallet = await this.prisma.wallet.findUnique({ where: { userId: order.userId } });
    if (wallet) {
      await this.prisma.$transaction(async (tx) => {
        const w = await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: order.total } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "REFUND",
            amount: order.total,
            balanceAfter: w.balance,
            description: `คืนเครดิตคำสั่งซื้อ ${order.orderNumber}`,
            referenceType: "order",
            referenceId: order.id,
          },
        });
        await tx.order.update({
          where: { id: orderId },
          data: { status: "REFUNDED" },
        });
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      });
    } else {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: "REFUNDED" },
      });
    }
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
  async listUsers(query: { q?: string; role?: Role; page?: number; pageSize?: number }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: {
      role?: Role;
      OR?: Array<{ email?: { contains: string; mode: "insensitive" }; displayName?: { contains: string; mode: "insensitive" } }>;
    } = {};
    if (query.role) where.role = query.role;
    if (query.q) {
      where.OR = [
        { email: { contains: query.q, mode: "insensitive" } },
        { displayName: { contains: query.q, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        sellerRating: u.sellerRating,
        createdAt: u.createdAt.toISOString(),
      })),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
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
    const [orders, revenue, marketplaceVolume, users, listings, shopToShip, marketplaceToShip, disputes] = await Promise.all([
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
      this.prisma.order.count({ where: { status: { in: ["PAID", "PROCESSING"] } } }),
      this.prisma.marketplaceOrder.count({ where: { status: "PAID_HELD" } }),
      this.prisma.marketplaceOrder.count({ where: { status: "DISPUTED" } }),
    ]);
    return {
      paidOrders: orders,
      shopRevenue: toBaht(revenue._sum.total ?? 0),
      marketplaceFeeRevenue: toBaht(marketplaceVolume._sum.platformFee ?? 0),
      users,
      activeListings: listings,
      shopToShip,
      marketplaceToShip,
      disputes,
    };
  }

  private serializeShipment(shipment: any) {
    if (!shipment) return null;
    return {
      id: shipment.id,
      carrier: shipment.carrier,
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      events: (shipment.events ?? []).map((event: any) => ({
        status: event.status,
        note: event.note,
        at: event.at.toISOString(),
      })),
    };
  }
}
