import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import type { NormalizedCarrierEvent, ShipmentStatus, UpdateShipmentInput } from "@cardverse/shared";
import { PrismaService } from "../prisma/prisma.service";
import { QueueService } from "../queue/queue.service";
import { MarketplaceOrdersService } from "../marketplace/marketplace-orders.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { assertValidShipmentTransition, normalizeShipmentUpdate, orderStatusForShipment } from "./shipping.types";

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly marketplaceOrders: MarketplaceOrdersService,
    private readonly realtime: RealtimeGateway,
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

    try {
      assertValidShipmentTransition(order.shipment?.status, input.status ?? "SHIPPED");
    } catch {
      throw new BadRequestException("ไม่สามารถเปลี่ยนสถานะเป็นจัดส่งล้มเหลวหลังจากจัดส่งแล้ว");
    }

    const shipment = normalizeShipmentUpdate(input);
    const orderStatus = orderStatusForShipment(shipment.status);
    const isFirstShipment = order.status === "PAID_HELD";
    const autoTrackingEnabled = shipment.carrier === "FLASH";
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
          autoTrackingEnabled,
          trackingSource: autoTrackingEnabled ? "FLASH" : null,
          events: {
            create: { status: shipment.status, note: shipment.note ?? "ผู้ขายอัปเดตการจัดส่ง" },
          },
        },
        update: {
          carrier: shipment.carrier,
          trackingNumber: shipment.trackingNumber,
          status: shipment.status,
          autoTrackingEnabled,
          trackingSource: autoTrackingEnabled ? "FLASH" : null,
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

    try {
      assertValidShipmentTransition(order.shipment?.status, input.status ?? "SHIPPED");
    } catch {
      throw new BadRequestException("ไม่สามารถเปลี่ยนสถานะเป็นจัดส่งล้มเหลวหลังจากจัดส่งแล้ว");
    }

    const shipment = normalizeShipmentUpdate(input);
    const orderStatus = orderStatusForShipment(shipment.status);
    const autoTrackingEnabled = shipment.carrier === "FLASH";

    await this.prisma.$transaction([
      this.prisma.shipment.upsert({
        where: { orderId },
        create: {
          orderId,
          carrier: shipment.carrier,
          trackingNumber: shipment.trackingNumber,
          status: shipment.status,
          autoTrackingEnabled,
          trackingSource: autoTrackingEnabled ? "FLASH" : null,
          events: { create: { status: shipment.status, note: shipment.note } },
        },
        update: {
          carrier: shipment.carrier,
          trackingNumber: shipment.trackingNumber,
          status: shipment.status,
          autoTrackingEnabled,
          trackingSource: autoTrackingEnabled ? "FLASH" : null,
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
      link: `/account/orders/${orderId}`,
    });
    return { ok: true };
  }

  async applyCarrierEvent(input: NormalizedCarrierEvent) {
    const at = new Date(input.timestamp);
    const shipment = await this.prisma.shipment.findFirst({
      where: {
        carrier: input.courier,
        trackingNumber: input.trackingNumber,
      },
      include: {
        order: true,
        marketplaceOrder: true,
      },
    });

    if (!shipment) {
      await this.prisma.shipmentEvent.create({
        data: this.carrierEventData(input, {
          accepted: false,
          ignoredReason: "missing-shipment",
          at,
        }),
      });
      return { accepted: false, ignoredReason: "missing-shipment" };
    }

    const duplicate = await this.prisma.shipmentEvent.findFirst({
      where: {
        courier: input.courier,
        eventKey: input.eventKey,
        accepted: true,
      },
    });
    if (duplicate) {
      await this.prisma.shipmentEvent.create({
        data: this.carrierEventData(input, {
          shipmentId: shipment.id,
          accepted: false,
          ignoredReason: "duplicate",
          at,
        }),
      });
      return { accepted: false, ignoredReason: "duplicate", shipmentId: shipment.id };
    }

    const stale = this.isStaleStatus(input.status, shipment.status);
    if (stale) {
      await this.prisma.shipmentEvent.create({
        data: this.carrierEventData(input, {
          shipmentId: shipment.id,
          accepted: false,
          ignoredReason: "stale-status",
          at,
        }),
      });
      return { accepted: false, ignoredReason: "stale-status", shipmentId: shipment.id };
    }

    const orderStatus = orderStatusForShipment(input.status);
    await this.prisma.$transaction([
      this.prisma.shipment.update({
        where: { id: shipment.id },
        data: {
          status: input.status,
          autoTrackingEnabled: true,
          trackingSource: input.courier,
          lastTrackedAt: at,
          lastCourierSyncAt: new Date(),
          events: {
            create: this.carrierEventData(input, {
              accepted: true,
              at,
            }),
          },
        },
      }),
      ...(shipment.orderId && orderStatus
        ? [
            this.prisma.order.update({
              where: { id: shipment.orderId },
              data: { status: orderStatus },
            }),
          ]
        : []),
      ...(shipment.marketplaceOrderId && orderStatus
        ? [
            this.prisma.marketplaceOrder.update({
              where: { id: shipment.marketplaceOrderId },
              data:
                orderStatus === "DELIVERED"
                  ? { status: "DELIVERED", deliveredAt: at }
                  : orderStatus === "CANCELLED"
                    ? { status: "CANCELLED" }
                    : { status: "SHIPPED" },
            }),
          ]
        : []),
    ]);

    const userIds = [
      shipment.order?.userId,
      shipment.marketplaceOrder?.buyerId,
      shipment.marketplaceOrder?.sellerId,
    ].filter((value): value is string => Boolean(value));

    const update = {
      shipmentId: shipment.id,
      orderId: shipment.orderId,
      marketplaceOrderId: shipment.marketplaceOrderId,
      userIds,
      carrier: input.courier,
      trackingNumber: input.trackingNumber,
      status: input.status,
      note: input.note ?? null,
      at: at.toISOString(),
    };
    this.realtime.emitShipmentUpdate(update);

    await Promise.all(
      userIds.map((userId) =>
        this.queue.enqueueNotification({
          userId,
          type: "SHIPMENT_UPDATE",
          title: input.status === "DELIVERED" ? "พัสดุจัดส่งสำเร็จแล้ว" : "พัสดุมีการอัปเดตจาก Flash Express",
          body: `FLASH • ${input.trackingNumber}`,
          link: shipment.marketplaceOrderId
            ? `/account/purchases/${shipment.marketplaceOrderId}`
            : shipment.orderId
              ? `/account/orders/${shipment.orderId}`
              : "/account/orders",
        }),
      ),
    );

    if (
      input.status === "DELIVERED" &&
      shipment.marketplaceOrderId &&
      shipment.marketplaceOrder?.status !== "COMPLETED"
    ) {
      try {
        await this.marketplaceOrders.completeAndRelease(shipment.marketplaceOrderId);
      } catch (err) {
        if (err instanceof BadRequestException) {
          this.logger.warn(`Skipped duplicate escrow release for ${shipment.marketplaceOrderId}`);
        } else {
          throw err;
        }
      }
    }

    return { accepted: true, shipmentId: shipment.id };
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

  private carrierEventData(
    input: NormalizedCarrierEvent,
    options: {
      shipmentId?: string;
      accepted: boolean;
      ignoredReason?: string;
      at: Date;
    },
  ) {
    return {
      shipmentId: options.shipmentId,
      courier: input.courier,
      trackingNumber: input.trackingNumber,
      status: input.status,
      rawStatus: input.rawStatus,
      normalizedStatus: input.status,
      accepted: options.accepted,
      ignoredReason: options.ignoredReason,
      eventKey: input.eventKey,
      rawPayload: input.rawPayload as any,
      note: input.note,
      at: options.at,
    };
  }

  private isStaleStatus(next: ShipmentStatus, current: ShipmentStatus) {
    if (this.isTerminalStatus(next)) return false;
    return this.statusRank(next) < this.statusRank(current);
  }

  private isTerminalStatus(status: ShipmentStatus) {
    return ["DELIVERED", "CANCELLED", "EXCEPTION", "FAILED"].includes(status);
  }

  private statusRank(status: ShipmentStatus) {
    const ranks: Record<ShipmentStatus, number> = {
      PENDING: 0,
      CONFIRMED: 1,
      PACKED: 2,
      LABEL_CREATED: 2,
      SHIPPED: 3,
      IN_TRANSIT: 3,
      OUT_FOR_DELIVERY: 4,
      DELIVERED: 5,
      CANCELLED: 6,
      EXCEPTION: 6,
      FAILED: 6,
    };
    return ranks[status] ?? 0;
  }
}
