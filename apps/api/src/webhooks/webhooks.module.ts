import { Module } from "@nestjs/common";
import { StripeWebhookController } from "./stripe-webhook.controller";
import { PaymentsModule } from "../payments/payments.module";
import { MarketplaceModule } from "../marketplace/marketplace.module";
import { OrdersModule } from "../orders/orders.module";

@Module({
  imports: [PaymentsModule, MarketplaceModule, OrdersModule],
  controllers: [StripeWebhookController],
})
export class WebhooksModule {}
