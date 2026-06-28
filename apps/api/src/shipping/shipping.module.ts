import { Module } from "@nestjs/common";
import { ShippingService } from "./shipping.service";
import { ShippingController } from "./shipping.controller";
import { MarketplaceModule } from "../marketplace/marketplace.module";

@Module({
  imports: [MarketplaceModule],
  controllers: [ShippingController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}
