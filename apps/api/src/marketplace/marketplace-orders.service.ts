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
import { serializeTrade, catalogItemInclude, toBaht } from "../common/serializers";

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
  ) {}

  /** Step 1: buyer initiates purchase; escrow PaymentIntent is created. */
  async buy(buyerId: string, listingId: string) {
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

    const amount = listing.price;
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
      // MOCK mode: treat payment as instantly captured so the demo flow works.
      await this.markPaid(order.id, null);
      return { orderId: order.id, mock: true, clientSecret: null };
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
        data: { marketplaceOrderId: orderId, status: "PENDING" },
      }),
    ]);

    await this.queue.enqueueNotification({
      userId: order.sellerId,
      type: "MARKETPLACE_SALE",
      title: "มีคนซื้อการ์ดของคุณ",
      body: "กรุณาจัดส่งและอัปเดตเลขพัสดุในระบบ",
      link: `/account/sales/${orderId}`,
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

    // Transfer funds to the seller (live mode only).
    let transferId: string | null = null;
    if (this.stripe.enabled && order.seller.stripeConnectAccountId) {
      const transfer = await this.stripe.transferToSeller({
        amount: order.sellerPayout,
        destinationAccountId: order.seller.stripeConnectAccountId,
        orderId: order.id,
        sourceChargeId: order.stripeChargeId ?? undefined,
      });
      transferId = transfer.id;
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
      link: `/account/sales/${orderId}`,
    });

    return { ok: true };
  }

  async refund(orderId: string) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (this.stripe.enabled && order.stripePaymentIntentId) {
      await this.stripe.refund(order.stripePaymentIntentId);
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

  static autoReleaseDelayMs() {
    return AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000;
  }
}
