import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StripeService } from "../payments/stripe.service";
import { QueueService } from "../queue/queue.service";
import { WalletService } from "../wallet/wallet.service";
import { toBaht } from "../common/serializers";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly queue: QueueService,
    private readonly wallet: WalletService,
  ) {}

  private orderNumber() {
    return `#${Math.floor(100000 + Math.random() * 900000)}`;
  }

  async checkout(
    userId: string,
    params: {
      addressId?: string;
      couponCode?: string;
      shipping?: number;
      payWithCredit?: boolean;
    },
  ) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException("ตะกร้าว่างเปล่า");
    }

    let subtotal = 0;
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(`สินค้า ${item.product.name} ไม่พอ`);
      }
      subtotal += item.product.price * item.quantity;
    }

    let discount = 0;
    let couponId: string | undefined;
    if (params.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: params.couponCode },
      });
      if (coupon && coupon.active) {
        couponId = coupon.id;
        if (coupon.percentOff) discount = Math.round((subtotal * coupon.percentOff) / 100);
        if (coupon.amountOff) discount += coupon.amountOff;
      }
    }

    const shipping = Math.round(Number(params.shipping ?? 0) * 100) || 0;
    const total = Math.max(0, subtotal - discount) + shipping;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    const order = await this.prisma.order.create({
      data: {
        orderNumber: this.orderNumber(),
        userId,
        status: "PENDING",
        subtotal,
        discount,
        shipping,
        total,
        couponId,
        addressId: params.addressId,
        items: {
          create: cart.items.map((i) => ({
            productId: i.productId,
            name: i.product.name,
            unitPrice: i.product.price,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: true },
    });

    if (params.payWithCredit || !this.stripe.enabled) {
      await this.wallet.payShopOrder(userId, order.id, total);
      await this.markPaid(order.id, null);
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        mock: true,
        paidWithCredit: true,
        url: null,
      };
    }

    const session = await this.stripe.createCheckoutSession({
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerEmail: user?.email ?? "buyer@cardverse",
      lineItems: order.items.map((i) => ({
        name: i.name,
        amount: i.unitPrice,
        quantity: i.quantity,
      })),
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return { orderId: order.id, orderNumber: order.orderNumber, mock: false, url: session.url };
  }

  async markPaid(orderId: string, paymentIntentId: string | null) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.status !== "PENDING") return;

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: "PAID", stripePaymentIntentId: paymentIntentId },
      }),
      ...order.items.map((i) =>
        this.prisma.product.update({
          where: { id: i.productId },
          data: { stock: { decrement: i.quantity }, soldCount: { increment: i.quantity } },
        }),
      ),
      this.prisma.shipment.create({ data: { orderId, status: "PENDING" } }),
      this.prisma.cartItem.deleteMany({ where: { cart: { userId: order.userId } } }),
    ]);

    await this.queue.enqueueNotification({
      userId: order.userId,
      type: "ORDER_UPDATE",
      title: "ชำระเงินสำเร็จ",
      body: `คำสั่งซื้อ ${order.orderNumber} กำลังเตรียมจัดส่ง`,
      link: `/account/orders/${orderId}`,
    });
  }

  async listMine(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { items: true, shipment: { include: { events: true } } },
      orderBy: { createdAt: "desc" },
    });
    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: toBaht(o.total),
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: toBaht(i.unitPrice),
      })),
      shipment: this.serializeShipment(o.shipment),
    }));
  }

  async get(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true, shipment: { include: { events: true } } },
    });
    if (!order) throw new NotFoundException("Order not found");
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: toBaht(order.subtotal),
      shipping: toBaht(order.shipping),
      discount: toBaht(order.discount),
      total: toBaht(order.total),
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: toBaht(i.unitPrice),
      })),
      shipment: this.serializeShipment(order.shipment),
    };
  }

  async getShipment(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { shipment: { include: { events: true } } },
    });
    if (!order) throw new NotFoundException("Order not found");
    return this.serializeShipment(order.shipment);
  }

  private serializeShipment(shipment: any) {
    if (!shipment) return null;
    return {
      id: shipment.id,
      carrier: shipment.carrier,
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      autoTrackingEnabled: shipment.autoTrackingEnabled,
      trackingSource: shipment.trackingSource,
      lastTrackedAt: shipment.lastTrackedAt?.toISOString() ?? null,
      lastCourierSyncAt: shipment.lastCourierSyncAt?.toISOString() ?? null,
      events: shipment.events.map((e: any) => ({
        status: e.status,
        note: e.note,
        at: e.at.toISOString(),
        courier: e.courier,
        rawStatus: e.rawStatus,
        accepted: e.accepted,
        ignoredReason: e.ignoredReason,
      })),
    };
  }
}
