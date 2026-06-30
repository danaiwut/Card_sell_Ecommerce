import { Module } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { MarketplaceModule } from "../marketplace/marketplace.module";
import { ShippingModule } from "../shipping/shipping.module";

@Module({
  imports: [MarketplaceModule, ShippingModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
