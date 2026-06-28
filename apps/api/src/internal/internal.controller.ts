import { Controller, Param, Post, UseGuards } from "@nestjs/common";
import { Public } from "../auth/decorators";
import { InternalGuard } from "../common/internal.guard";
import { MarketplaceOrdersService } from "../marketplace/marketplace-orders.service";
import { ShippingService } from "../shipping/shipping.service";

/** Endpoints invoked by the background worker (guarded by a shared secret). */
@Public()
@UseGuards(InternalGuard)
@Controller("internal")
export class InternalController {
  constructor(
    private readonly orders: MarketplaceOrdersService,
    private readonly shipping: ShippingService,
  ) {}

  @Post("orders/:id/release-escrow")
  release(@Param("id") id: string) {
    return this.orders.completeAndRelease(id);
  }

  @Post("shipments/:id/delivered")
  delivered(@Param("id") id: string) {
    return this.shipping.markDelivered(id);
  }
}
