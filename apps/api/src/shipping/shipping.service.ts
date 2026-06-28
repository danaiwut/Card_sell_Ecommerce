import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import type { UpdateShipmentInput } from "@cardverse/shared";
import { PrismaService } from "../prisma/prisma.service";
import { QueueService } from "../queue/queue.service";
import { MarketplaceOrdersService } from "../marketplace/marketplace-orders.service";

@Injectable()
export class ShippingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  /** Seller adds carrier + tracking to a marketplace order; starts escrow timer. */
  async updateMarketplaceShipment(
    sellerId: string,
    orderId: string,
    input: UpdateShipmentInput,
  ) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
      include: { shipment: true },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.sellerId !== sellerId) throw new ForbiddenException("ไม่ใช่คำสั่งซื้อของคุณ");
    if (order.status !== "PAID_HELD") {
      throw new BadRequestException("คำสั่งซื้อยังไม่พร้อมจัดส่ง");
    }

    const releaseDueAt = new Date(Date.now() + MarketplaceOrdersService.autoReleaseDelayMs());

    await this.prisma.$transaction([
      this.prisma.shipment.update({
        where: { marketplaceOrderId: orderId },
        data: {
          carrier: input.carrier,
          trackingNumber: input.trackingNumber,
          status: "IN_TRANSIT",
          events: {
            create: { status: "IN_TRANSIT", note: input.note ?? "ผู้ขายจัดส่งแล้ว" },
          },
        },
      }),
      this.prisma.marketplaceOrder.update({
        where: { id: orderId },
        data: { status: "SHIPPED", shippedAt: new Date(), releaseDueAt },
      }),
    ]);

    // Schedule escrow auto-release if the buyer doesn't confirm in time.
    await this.queue.enqueueEscrowRelease(
      orderId,
      MarketplaceOrdersService.autoReleaseDelayMs(),
    );

    await this.queue.enqueueNotification({
      userId: order.buyerId,
      type: "SHIPMENT_UPDATE",
      title: "พัสดุถูกจัดส่งแล้ว",
      body: `${input.carrier} • ${input.trackingNumber}`,
      link: `/account/purchases/${orderId}`,
    });

    return { ok: true, releaseDueAt };
  }

  /** Manager updates shipping for a first-party shop order. */
  async updateShopShipment(orderId: string, input: UpdateShipmentInput) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shipment: true },
    });
    if (!order) throw new NotFoundException("Order not found");

    await this.prisma.shipment.upsert({
      where: { orderId },
      update: {
        carrier: input.carrier,
        trackingNumber: input.trackingNumber,
        status: "IN_TRANSIT",
        events: { create: { status: "IN_TRANSIT", note: input.note } },
      },
      create: {
        orderId,
        carrier: input.carrier,
        trackingNumber: input.trackingNumber,
        status: "IN_TRANSIT",
        events: { create: { status: "IN_TRANSIT", note: input.note } },
      },
    });
    await this.prisma.order.update({ where: { id: orderId }, data: { status: "SHIPPED" } });
    await this.queue.enqueueNotification({
      userId: order.userId,
      type: "SHIPMENT_UPDATE",
      title: "คำสั่งซื้อถูกจัดส่งแล้ว",
      body: `${input.carrier} • ${input.trackingNumber}`,
      link: "/account/orders",
    });
    return { ok: true };
  }

  /** Mark a shipment delivered (manual or via carrier polling). */
  async markDelivered(shipmentId: string) {
    const shipment = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: "DELIVERED",
        events: { create: { status: "DELIVERED", note: "จัดส่งสำเร็จ" } },
      },
    });
    if (shipment.marketplaceOrderId) {
      await this.prisma.marketplaceOrder.update({
        where: { id: shipment.marketplaceOrderId },
        data: { status: "DELIVERED", deliveredAt: new Date() },
      });
    }
    if (shipment.orderId) {
      await this.prisma.order.update({
        where: { id: shipment.orderId },
        data: { status: "DELIVERED" },
      });
    }
    return { ok: true };
  }
}
