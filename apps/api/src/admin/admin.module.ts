import { Module } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { MarketplaceModule } from "../marketplace/marketplace.module";
import { NewsModule } from "../news/news.module";
import { ShippingModule } from "../shipping/shipping.module";

@Module({
  imports: [MarketplaceModule, NewsModule, ShippingModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
