import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import type { Request } from "express";
import { Public } from "../auth/decorators";
import { StripeService } from "../payments/stripe.service";
import { MarketplaceOrdersService } from "../marketplace/marketplace-orders.service";
import { OrdersService } from "../orders/orders.service";

@Controller("payments")
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripe: StripeService,
    private readonly marketplaceOrders: MarketplaceOrdersService,
    private readonly orders: OrdersService,
  ) {}

  @Public()
  @Post("webhook")
  @HttpCode(200)
  async handle(@Req() req: Request, @Headers("stripe-signature") signature: string) {
    if (!this.stripe.enabled) return { skipped: true };
    const raw = req.body as unknown as Buffer;
    let event;
    try {
      event = this.stripe.constructEvent(raw, signature);
    } catch (err) {
      this.logger.error(`Webhook signature failed: ${String(err)}`);
      throw new BadRequestException("Invalid signature");
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as any;
        const orderId = pi.metadata?.orderId;
        const kind = pi.metadata?.kind;
        if (orderId && kind === "marketplace") {
          await this.marketplaceOrders.markPaid(orderId, pi.latest_charge ?? null);
        }
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const orderId = session.metadata?.orderId;
        if (orderId) {
          await this.orders.markPaid(orderId, session.payment_intent ?? null);
        }
        break;
      }
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }

    return { received: true };
  }
}
