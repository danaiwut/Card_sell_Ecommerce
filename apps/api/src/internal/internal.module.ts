import { Module } from "@nestjs/common";
import { InternalController } from "./internal.controller";
import { MarketplaceModule } from "../marketplace/marketplace.module";
import { ShippingModule } from "../shipping/shipping.module";

@Module({
  imports: [MarketplaceModule, ShippingModule],
  controllers: [InternalController],
})
export class InternalModule {}
