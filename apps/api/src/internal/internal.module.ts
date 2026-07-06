import { Module } from "@nestjs/common";
import { InternalController } from "./internal.controller";
import { MarketplaceModule } from "../marketplace/marketplace.module";
import { NewsModule } from "../news/news.module";
import { ShippingModule } from "../shipping/shipping.module";

@Module({
  imports: [MarketplaceModule, NewsModule, ShippingModule],
  controllers: [InternalController],
})
export class InternalModule {}
