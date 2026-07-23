import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StripeService } from "../payments/stripe.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { QueueService } from "../queue/queue.service";
import { MarketService } from "./market.service";
import {
  catalogItemInclude,
  serializeCatalogItem,
  serializeTrade,
  toBaht,
} from "../common/serializers";
import { WalletService } from "../wallet/wallet.service";

const FEE_PERCENT = Number(process.env.MARKETPLACE_FEE_PERCENT ?? 8);
const AUTO_RELEASE_DAYS = Number(process.env.ESCROW_AUTO_RELEASE_DAYS ?? 7);

@Injectable()
export class MarketplaceOrdersService {
  private readonly logger = new Logger(MarketplaceOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly realtime: RealtimeGateway,
    private readonly queue: QueueService,
    private readonly market: MarketService,
    private readonly wallet: WalletService,
  ) {}

  /** Step 1: buyer initiates purchase; escrow PaymentIntent is created. */
  async buy(buyerId: string, listingId: string, offerId?: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: true },
    });
    if (!listing) throw new NotFoundException("Listing not found");
    if (listing.status !== "ACTIVE") {
      throw new BadRequestException("ประกาศนี้ขายไปแล้วหรือถูกปิด");
    }
    if (listing.sellerId === buyerId) {
      throw new BadRequestException("ไม่สามารถซื้อประกาศของตัวเองได้");
    }

    let amount = listing.price;
    if (offerId) {
      const offer = await this.prisma.listingOffer.findUnique({ where: { id: offerId } });
      if (
        !offer ||
        offer.listingId !== listingId ||
        offer.buyerId !== buyerId ||
        offer.status !== "ACCEPTED"
      ) {
        throw new BadRequestException("ข้อเสนอราคานี้ไม่สามารถใช้ซื้อได้");
      }
      amount = offer.amount;
    }

    const platformFee = Math.round((amount * FEE_PERCENT) / 100);
    const sellerPayout = amount - platformFee;

    const buyer = await this.prisma.user.findUnique({ where: { id: buyerId } });

    const order = await this.prisma.marketplaceOrder.create({
      data: {
        listingId,
        buyerId,
        sellerId: listing.sellerId,
        amount,
        platformFee,
        sellerPayout,
        status: "PENDING_PAYMENT",
      },
    });

    if (!this.stripe.enabled) {
      await this.wallet.holdEscrow(buyerId, order.id, amount);
      await this.markPaid(order.id, null);
      return { orderId: order.id, mock: true, paidWithCredit: true, clientSecret: null };
    }

    const intent = await this.stripe.createEscrowPaymentIntent({
      amount,
      orderId: order.id,
      customerEmail: buyer?.email ?? "buyer@cardverse",
    });

    await this.prisma.marketplaceOrder.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: intent.id },
    });

    return { orderId: order.id, mock: false, clientSecret: intent.client_secret };
  }

  /** Step 2: payment captured -> funds held in escrow; listing marked sold. */
  async markPaid(orderId: string, chargeId: string | null) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
    });
    if (!order || order.status !== "PENDING_PAYMENT") return;

    await this.prisma.$transaction([
      this.prisma.marketplaceOrder.update({
        where: { id: orderId },
        data: { status: "PAID_HELD", stripeChargeId: chargeId },
      }),
      this.prisma.listing.update({
        where: { id: order.listingId },
        data: { status: "SOLD" },
      }),
      this.prisma.shipment.create({
        data: {
          marketplaceOrderId: orderId,
          status: "PENDING",
          events: {
            create: { status: "PENDING", note: "รอผู้ขายจัดส่ง", at: new Date() },
          },
        },
      }),
    ]);

    await this.queue.enqueueNotification({
      userId: order.sellerId,
      type: "MARKETPLACE_SALE",
      title: "มีคนซื้อการ์ดของคุณ",
      body: "กรุณาจัดส่งและอัปเดตเลขพัสดุในระบบ",
      link: `/account/sell`,
    });
    await this.queue.enqueueNotification({
      userId: order.buyerId,
      type: "ORDER_UPDATE",
      title: "ชำระเงินสำเร็จ",
      body: "คำสั่งซื้อของคุณอยู่ระหว่างรอผู้ขายจัดส่ง",
      link: `/account/purchases/${orderId}`,
    });
  }

  /** Step 4: buyer confirms receipt (or worker auto-confirms) -> release escrow. */
  async confirmReceived(buyerId: string, orderId: string) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.buyerId !== buyerId) throw new ForbiddenException();
    if (!["SHIPPED", "DELIVERED"].includes(order.status)) {
      throw new BadRequestException("ยังจัดส่งไม่สำเร็จ");
    }
    return this.completeAndRelease(orderId);
  }

  /** Release escrow to seller, record the Trade, update charts + feed. */
  async completeAndRelease(orderId: string) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
      include: { listing: true, seller: true },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.status === "COMPLETED") return { ok: true, alreadyCompleted: true };
    if (!["SHIPPED", "DELIVERED", "PAID_HELD"].includes(order.status)) {
      throw new BadRequestException("สถานะคำสั่งซื้อไม่ถูกต้องสำหรับการปล่อยเงิน");
    }

    // Transfer funds to the seller (live Stripe or credit wallet in demo).
    let transferId: string | null = null;
    if (this.stripe.enabled && order.seller.stripeConnectAccountId) {
      const transfer = await this.stripe.transferToSeller({
        amount: order.sellerPayout,
        destinationAccountId: order.seller.stripeConnectAccountId,
        orderId: order.id,
        sourceChargeId: order.stripeChargeId ?? undefined,
      });
      transferId = transfer.id;
    } else {
      await this.wallet.releaseEscrow(
        order.buyerId,
        order.sellerId,
        order.id,
        order.amount,
        order.sellerPayout,
      );
    }

    const soldAt = new Date();
    const [, trade] = await this.prisma.$transaction([
      this.prisma.marketplaceOrder.update({
        where: { id: orderId },
        data: {
          status: "COMPLETED",
          completedAt: soldAt,
          stripeTransferId: transferId,
        },
      }),
      this.prisma.trade.create({
        data: {
          catalogItemId: order.listing.catalogItemId,
          marketplaceOrderId: order.id,
          sellerId: order.sellerId,
          price: order.amount,
          soldAt,
        },
        include: { catalogItem: true, seller: true },
      }),
    ]);

    // Live "recent sales" feed + updated price chart.
    this.realtime.emitRecentSale(serializeTrade(trade));
    const stats = await this.market.stats(order.listing.catalogItemId);
    this.realtime.emitPriceUpdate(stats);
    await this.queue.enqueuePriceAggregation(order.listing.catalogItemId);

    await this.queue.enqueueNotification({
      userId: order.sellerId,
      type: "PAYOUT",
      title: "ได้รับเงินจากการขาย",
      body: `ยอดสุทธิ ฿${toBaht(order.sellerPayout).toLocaleString()}`,
      link: `/account/sell`,
    });
    await this.queue.enqueueNotification({
      userId: order.buyerId,
      type: "ORDER_UPDATE",
      title: "ยืนยันรับสินค้าแล้ว",
      body: "กรุณาให้คะแนนผู้ขายเพื่อช่วยชุมชน",
      link: `/account/purchases/${orderId}?review=1`,
    });

    return { ok: true, needsReview: true };
  }

  async submitReview(
    buyerId: string,
    orderId: string,
    data: { rating: number; comment?: string },
  ) {
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException("คะแนนต้องอยู่ระหว่าง 1–5");
    }
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
      include: { review: true, seller: true },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.buyerId !== buyerId) throw new ForbiddenException();
    if (order.status !== "COMPLETED") {
      throw new BadRequestException("สามารถรีวิวได้หลังยืนยันรับสินค้าแล้วเท่านั้น");
    }
    if (order.review) throw new BadRequestException("คุณรีวิวคำสั่งซื้อนี้แล้ว");

    await this.prisma.$transaction(async (tx) => {
      await tx.sellerReview.create({
        data: {
          orderId,
          authorId: buyerId,
          sellerId: order.sellerId,
          rating: data.rating,
          comment: data.comment,
        },
      });
      const agg = await tx.sellerReview.aggregate({
        where: { sellerId: order.sellerId },
        _avg: { rating: true },
        _count: true,
      });
      await tx.user.update({
        where: { id: order.sellerId },
        data: {
          sellerRating: agg._avg.rating ?? 0,
          sellerRatingCount: agg._count,
        },
      });
    });

    await this.queue.enqueueNotification({
      userId: order.sellerId,
      type: "SYSTEM",
      title: "ได้รับรีวิวใหม่",
      body: `คะแนน ${data.rating}/5 จากผู้ซื้อ`,
      link: `/account/sell`,
    });

    return { ok: true };
  }

  async refund(orderId: string) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.status === "REFUNDED" || order.status === "COMPLETED") {
      return { ok: true, alreadyHandled: true };
    }
    if (this.stripe.enabled && order.stripePaymentIntentId) {
      await this.stripe.refund(order.stripePaymentIntentId);
    } else if (["PAID_HELD", "SHIPPED", "DELIVERED", "DISPUTED", "CANCELLED"].includes(order.status)) {
      await this.wallet.refundEscrow(order.buyerId, order.id, order.amount);
    }
    await this.prisma.$transaction([
      this.prisma.marketplaceOrder.update({
        where: { id: orderId },
        data: { status: "REFUNDED" },
      }),
      this.prisma.listing.update({
        where: { id: order.listingId },
        data: { status: "ACTIVE" },
      }),
    ]);
    return { ok: true };
  }

  async cancelOrder(userId: string, orderId: string, role: "buyer" | "seller" | "admin") {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (role === "buyer" && order.buyerId !== userId) throw new ForbiddenException();
    if (role === "seller" && order.sellerId !== userId) throw new ForbiddenException();
    if (["COMPLETED", "REFUNDED"].includes(order.status)) {
      throw new BadRequestException("คำสั่งซื้อนี้ดำเนินการเสร็จแล้ว");
    }
    return this.refund(orderId);
  }

  async dispute(buyerId: string, orderId: string, reason: string) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
    });
    if (!order || order.buyerId !== buyerId) throw new ForbiddenException();
    await this.prisma.marketplaceOrder.update({
      where: { id: orderId },
      data: { status: "DISPUTED" },
    });
    await this.queue.enqueueNotification({
      userId: order.sellerId,
      type: "SYSTEM",
      title: "มีการเปิดข้อพิพาท",
      body: reason,
    });
    return { ok: true };
  }

  async purchases(buyerId: string): Promise<any[]> {
    return this.prisma.marketplaceOrder.findMany({
      where: { buyerId },
      include: {
        listing: { include: { catalogItem: { include: catalogItemInclude }, seller: true } },
        shipment: { include: { events: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async purchase(buyerId: string, orderId: string): Promise<any> {
    const order = await this.prisma.marketplaceOrder.findFirst({
      where: { id: orderId, buyerId },
      include: {
        buyer: true,
        seller: true,
        review: true,
        listing: { include: { catalogItem: { include: catalogItemInclude }, seller: true } },
        shipment: { include: { events: true } },
      },
    });
    if (!order) throw new NotFoundException("Order not found");
    return this.serializeMarketplaceOrder(order);
  }

  async sales(sellerId: string): Promise<any[]> {
    return this.prisma.marketplaceOrder.findMany({
      where: { sellerId },
      include: {
        listing: { include: { catalogItem: { include: catalogItemInclude }, seller: true } },
        shipment: { include: { events: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async sale(sellerId: string, orderId: string): Promise<any> {
    const order = await this.prisma.marketplaceOrder.findFirst({
      where: { id: orderId, sellerId },
      include: {
        buyer: true,
        seller: true,
        listing: { include: { catalogItem: { include: catalogItemInclude }, seller: true } },
        shipment: { include: { events: true } },
      },
    });
    if (!order) throw new NotFoundException("Order not found");
    return this.serializeMarketplaceOrder(order);
  }

  static autoReleaseDelayMs() {
    return AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000;
  }

  private serializeMarketplaceOrder(order: any) {
    const toIso = (value: unknown) => {
      if (value instanceof Date) return value.toISOString();
      if (typeof value === "string" && value) return new Date(value).toISOString();
      return new Date().toISOString();
    };

    return {
      id: order.id,
      status: order.status,
      amount: toBaht(order.amount),
      platformFee: toBaht(order.platformFee),
      sellerPayout: toBaht(order.sellerPayout),
      createdAt: toIso(order.createdAt),
      buyer: order.buyer
        ? { id: order.buyer.id, displayName: order.buyer.displayName ?? "ผู้ซื้อ" }
        : { id: order.buyerId, displayName: "ผู้ซื้อ" },
      seller: order.seller
        ? { id: order.seller.id, displayName: order.seller.displayName ?? "ผู้ขาย" }
        : { id: order.sellerId, displayName: "ผู้ขาย" },
      listing: {
        id: order.listing.id,
        condition: order.listing.condition,
        catalogItem: serializeCatalogItem(order.listing.catalogItem),
      },
      shipment: order.shipment
        ? {
            id: order.shipment.id,
            carrier: order.shipment.carrier,
            trackingNumber: order.shipment.trackingNumber,
            status: order.shipment.status,
            autoTrackingEnabled: order.shipment.autoTrackingEnabled,
            trackingSource: order.shipment.trackingSource,
            lastTrackedAt: order.shipment.lastTrackedAt ? toIso(order.shipment.lastTrackedAt) : null,
            lastCourierSyncAt: order.shipment.lastCourierSyncAt
              ? toIso(order.shipment.lastCourierSyncAt)
              : null,
            events: (order.shipment.events ?? []).map((e: any) => ({
              status: e.status,
              note: e.note,
              at: toIso(e.at),
              courier: e.courier,
              rawStatus: e.rawStatus,
              accepted: e.accepted,
              ignoredReason: e.ignoredReason,
            })),
          }
        : null,
      review: order.review
        ? {
            rating: order.review.rating,
            comment: order.review.comment,
            createdAt: toIso(order.review.createdAt),
          }
        : null,
    };
  }
}
