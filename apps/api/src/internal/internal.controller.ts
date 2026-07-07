import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import type { NormalizedCarrierEvent } from "@cardverse/shared";
import { Public } from "../auth/decorators";
import { InternalGuard } from "../common/internal.guard";
import { MarketplaceOrdersService } from "../marketplace/marketplace-orders.service";
import { NewsService } from "../news/news.service";
import { ShippingService } from "../shipping/shipping.service";

/** Endpoints invoked by the background worker (guarded by a shared secret). */
@Public()
@UseGuards(InternalGuard)
@Controller("internal")
export class InternalController {
  constructor(
    private readonly orders: MarketplaceOrdersService,
    private readonly news: NewsService,
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

  @Post("shipments/carrier-event")
  carrierEvent(@Body() body: NormalizedCarrierEvent) {
    return this.shipping.applyCarrierEvent(body);
  }

  @Post("news/ingest")
  ingestNews(@Body() body: any) {
    return this.news.ingest(body);
  }
}
