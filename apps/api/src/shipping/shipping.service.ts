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
import { normalizeShipmentUpdate, orderStatusForShipment } from "./shipping.types";

@Injectable()
export class ShippingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  /** Seller adds carrier + tracking to a marketplace order; starts escrow timer. */
  async updateMarketplaceShipment(
    sellerId: string | null,
    orderId: string,
    input: UpdateShipmentInput,
    options: { skipSellerCheck?: boolean } = {},
  ) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
      include: { shipment: true },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (!options.skipSellerCheck && order.sellerId !== sellerId) {
      throw new ForbiddenException("ไม่ใช่คำสั่งซื้อของคุณ");
    }
    if (!["PAID_HELD", "SHIPPED", "DELIVERED"].includes(order.status)) {
      throw new BadRequestException("คำสั่งซื้อยังไม่พร้อมจัดส่ง");
    }

    const shipment = normalizeShipmentUpdate(input);
    const orderStatus = orderStatusForShipment(shipment.status);
    const isFirstShipment = order.status === "PAID_HELD";
    const releaseDueAt = isFirstShipment
      ? new Date(Date.now() + MarketplaceOrdersService.autoReleaseDelayMs())
      : order.releaseDueAt;

    const marketplaceOrderData: Record<string, unknown> = {};
    if (isFirstShipment) {
      marketplaceOrderData.status = "SHIPPED";
      marketplaceOrderData.shippedAt = new Date();
      marketplaceOrderData.releaseDueAt = releaseDueAt;
    }
    if (orderStatus === "DELIVERED") {
      marketplaceOrderData.status = "DELIVERED";
      marketplaceOrderData.deliveredAt = new Date();
    } else if (orderStatus === "SHIPPED" && order.status !== "DELIVERED") {
      marketplaceOrderData.status = "SHIPPED";
    }

    await this.prisma.$transaction([
      this.prisma.shipment.upsert({
        where: { marketplaceOrderId: orderId },
        create: {
          marketplaceOrderId: orderId,
          carrier: shipment.carrier,
          trackingNumber: shipment.trackingNumber,
          status: shipment.status,
          events: {
            create: { status: shipment.status, note: shipment.note ?? "ผู้ขายอัปเดตการจัดส่ง" },
          },
        },
        update: {
          carrier: shipment.carrier,
          trackingNumber: shipment.trackingNumber,
          status: shipment.status,
          events: {
            create: { status: shipment.status, note: shipment.note ?? "ผู้ขายอัปเดตการจัดส่ง" },
          },
        },
      }),
      ...(Object.keys(marketplaceOrderData).length
        ? [
            this.prisma.marketplaceOrder.update({
              where: { id: orderId },
              data: marketplaceOrderData,
            }),
          ]
        : []),
    ]);

    if (isFirstShipment) {
      // Schedule escrow auto-release if the buyer doesn't confirm in time.
      await this.queue.enqueueEscrowRelease(
        orderId,
        MarketplaceOrdersService.autoReleaseDelayMs(),
      );
    }

    await this.queue.enqueueNotification({
      userId: order.buyerId,
      type: "SHIPMENT_UPDATE",
      title: shipment.status === "DELIVERED" ? "พัสดุจัดส่งสำเร็จแล้ว" : "พัสดุมีการอัปเดต",
      body: `${shipment.carrier} • ${shipment.trackingNumber}`,
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

    const shipment = normalizeShipmentUpdate(input);
    const orderStatus = orderStatusForShipment(shipment.status);

    await this.prisma.$transaction([
      this.prisma.shipment.upsert({
        where: { orderId },
        create: {
          orderId,
          carrier: shipment.carrier,
          trackingNumber: shipment.trackingNumber,
          status: shipment.status,
          events: { create: { status: shipment.status, note: shipment.note } },
        },
        update: {
          carrier: shipment.carrier,
          trackingNumber: shipment.trackingNumber,
          status: shipment.status,
          events: { create: { status: shipment.status, note: shipment.note } },
        },
      }),
      ...(orderStatus
        ? [
            this.prisma.order.update({
              where: { id: orderId },
              data: { status: orderStatus },
            }),
          ]
        : []),
    ]);
    await this.queue.enqueueNotification({
      userId: order.userId,
      type: "SHIPMENT_UPDATE",
      title: shipment.status === "DELIVERED" ? "คำสั่งซื้อจัดส่งสำเร็จแล้ว" : "คำสั่งซื้อมีการอัปเดต",
      body: `${shipment.carrier} • ${shipment.trackingNumber}`,
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
