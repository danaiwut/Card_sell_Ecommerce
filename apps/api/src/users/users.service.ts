import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { toBaht } from "../common/serializers";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string) {
    const [user, ordersCount, purchasesCount, listingsCount, recentOrders] =
      await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId } }),
        this.prisma.order.count({ where: { userId } }),
        this.prisma.marketplaceOrder.count({ where: { buyerId: userId } }),
        this.prisma.listing.count({ where: { sellerId: userId, status: "ACTIVE" } }),
        this.prisma.order.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 4,
        }),
      ]);

    return {
      id: user!.id,
      email: user!.email,
      displayName: user!.displayName,
      avatarUrl: user!.avatarUrl,
      role: user!.role,
      level: user!.level,
      sellerOnboarded: user!.stripeConnectOnboarded,
      sellerRating: user!.sellerRating,
      stats: {
        orders: ordersCount,
        purchases: purchasesCount,
        listings: listingsCount,
      },
      recentOrders: recentOrders.map((o) => ({
        orderNumber: o.orderNumber,
        date: o.createdAt.toISOString(),
        total: toBaht(o.total),
        status: o.status,
      })),
    };
  }

  async updateProfile(userId: string, data: { displayName?: string; avatarUrl?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { displayName: data.displayName, avatarUrl: data.avatarUrl },
    });
    return { id: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl };
  }

  async addresses(userId: string) {
    return this.prisma.address.findMany({ where: { userId }, orderBy: { isDefault: "desc" } });
  }

  async addAddress(userId: string, data: any) {
    const payload = {
      ...data,
      line2: data.line2?.trim() ? data.line2.trim() : null,
    };
    if (payload.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return this.prisma.address.create({ data: { ...payload, userId } });
  }

  async updateAddress(userId: string, addressId: string, data: any) {
    const existing = await this.prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!existing) throw new NotFoundException("Address not found");
    if (data.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return this.prisma.address.update({ where: { id: addressId }, data });
  }

  async deleteAddress(userId: string, addressId: string) {
    const existing = await this.prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!existing) throw new NotFoundException("Address not found");
    await this.prisma.address.delete({ where: { id: addressId } });
    return { success: true };
  }
}
