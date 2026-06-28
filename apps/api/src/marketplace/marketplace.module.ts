import { Module } from "@nestjs/common";
import { ListingsService } from "./listings.service";
import { MarketService } from "./market.service";
import { MarketplaceOrdersService } from "./marketplace-orders.service";
import { MarketplaceController } from "./marketplace.controller";
import { PaymentsModule } from "../payments/payments.module";

@Module({
  imports: [PaymentsModule],
  controllers: [MarketplaceController],
  providers: [ListingsService, MarketService, MarketplaceOrdersService],
  exports: [MarketService, MarketplaceOrdersService],
})
export class MarketplaceModule {}
