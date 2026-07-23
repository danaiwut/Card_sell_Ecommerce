import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { ProductReviewInput } from "@cardverse/shared";
import { PrismaService } from "../prisma/prisma.service";
import { createEntityId } from "@cardverse/db";

@Injectable()
export class ProductReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForProduct(productId: string) {
    const reviews = await this.prisma.productReview.findMany({
      where: { productId },
      include: { author: true },
      orderBy: { createdAt: "desc" },
    });
    return reviews.map((r) => this.serialize(r));
  }

  async statsForProducts(productIds: string[]) {
    if (productIds.length === 0) return new Map<string, { rating: number; reviewCount: number }>();
    const reviews = await this.prisma.productReview.findMany({
      where: { productId: { in: productIds } },
    });
    const map = new Map<string, { total: number; count: number }>();
    for (const r of reviews) {
      const cur = map.get(r.productId) ?? { total: 0, count: 0 };
      cur.total += r.rating;
      cur.count += 1;
      map.set(r.productId, cur);
    }
    const out = new Map<string, { rating: number; reviewCount: number }>();
    for (const [id, { total, count }] of map) {
      out.set(id, { rating: Math.round((total / count) * 10) / 10, reviewCount: count });
    }
    return out;
  }

  async submit(userId: string, orderId: string, orderItemId: string, data: ProductReviewInput) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true, shipment: true },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.status !== "DELIVERED") {
      throw new BadRequestException("สามารถรีวิวได้หลังได้รับสินค้าแล้วเท่านั้น");
    }
    const shipmentDelivered = order.shipment?.status === "DELIVERED";
    if (!shipmentDelivered && order.status !== "DELIVERED") {
      throw new BadRequestException("สามารถรีวิวได้หลังได้รับสินค้าแล้วเท่านั้น");
    }

    const item = order.items.find((i) => i.id === orderItemId);
    if (!item) throw new NotFoundException("Order item not found");

    const existing = await this.prisma.productReview.findUnique({
      where: { orderItemId },
    });
    if (existing) throw new BadRequestException("คุณรีวิวสินค้านี้แล้ว");

    const review = await this.prisma.productReview.create({
      data: {
        id: createEntityId("prev", orderItemId),
        orderId,
        orderItemId,
        productId: item.productId,
        authorId: userId,
        rating: data.rating,
        comment: data.comment?.trim() || null,
      },
      include: { author: true },
    });

    return this.serialize(review);
  }

  async pendingForOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: { include: { review: true } } },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.status !== "DELIVERED") return [];

    return order.items
      .filter((i) => !i.review)
      .map((i) => ({
        orderItemId: i.id,
        productId: i.productId,
        name: i.name,
      }));
  }

  private serialize(r: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    author?: { displayName: string };
  }) {
    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      verifiedPurchase: true as const,
      author: { displayName: r.author?.displayName ?? "Customer" },
    };
  }
}
