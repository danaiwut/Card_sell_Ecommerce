import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import {
  createListingSchema,
  createOfferSchema,
  marketplaceQuerySchema,
  rejectOfferSchema,
} from "@cardverse/shared";
import { ListingsService } from "./listings.service";
import { MarketService } from "./market.service";
import { MarketplaceOrdersService } from "./marketplace-orders.service";
import { CurrentUser, Public } from "../auth/decorators";

@Controller("marketplace")
export class MarketplaceController {
  constructor(
    private readonly listings: ListingsService,
    private readonly market: MarketService,
    private readonly orders: MarketplaceOrdersService,
  ) {}

  // --- Listings ---
  @Public()
  @Get("listings")
  list(@Query() query: Record<string, string>) {
    return this.listings.list(marketplaceQuerySchema.parse(query));
  }

  @Get("listings/mine")
  mine(@CurrentUser("id") userId: string) {
    return this.listings.mine(userId);
  }

  @Post("listings")
  create(@CurrentUser("id") userId: string, @Body() body: unknown) {
    return this.listings.create(userId, createListingSchema.parse(body));
  }

  @Delete("listings/:id")
  cancel(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.listings.cancel(userId, id);
  }

  @Post("listings/:id/offers")
  createOffer(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.listings.createOffer(userId, id, createOfferSchema.parse(body));
  }

  @Get("offers/incoming")
  incomingOffers(@CurrentUser("id") userId: string) {
    return this.listings.incomingOffers(userId);
  }

  @Get("offers/mine")
  myOffers(@CurrentUser("id") userId: string) {
    return this.listings.myOffers(userId);
  }

  @Post("offers/:id/accept")
  acceptOffer(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.listings.acceptOffer(userId, id);
  }

  @Post("offers/:id/reject")
  rejectOffer(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.listings.rejectOffer(userId, id, rejectOfferSchema.parse(body));
  }

  @Public()
  @Get("catalog/:catalogItemId/listings")
  byCatalogItem(@Param("catalogItemId") id: string) {
    return this.listings.byCatalogItem(id);
  }

  // --- Market data ---
  @Public()
  @Get("recent-sales")
  recentSales(@Query("limit") limit = "15") {
    return this.market.recentSales(Number(limit));
  }

  @Public()
  @Get("stats/:catalogItemId")
  stats(@Param("catalogItemId") id: string, @Query("days") days = "30") {
    return this.market.stats(id, Number(days));
  }

  // --- Escrow orders ---
  @Post("orders/:listingId/buy")
  buy(
    @CurrentUser("id") userId: string,
    @Param("listingId") listingId: string,
    @Body() body: { offerId?: string },
  ) {
    return this.orders.buy(userId, listingId, body?.offerId);
  }

  @Post("orders/:id/confirm")
  confirm(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.orders.confirmReceived(userId, id);
  }

  @Post("orders/:id/dispute")
  dispute(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() body: { reason?: string },
  ) {
    return this.orders.dispute(userId, id, body.reason ?? "ไม่ได้รับสินค้า");
  }

  @Post("orders/:id/review")
  review(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() body: { rating: number; comment?: string },
  ) {
    return this.orders.submitReview(userId, id, body);
  }

  @Get("purchases")
  purchases(@CurrentUser("id") userId: string) {
    return this.orders.purchases(userId);
  }

  @Get("purchases/:id")
  purchase(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.orders.purchase(userId, id);
  }

  @Get("sales")
  sales(@CurrentUser("id") userId: string) {
    return this.orders.sales(userId);
  }

  @Get("sales/:id")
  sale(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.orders.sale(userId, id);
  }
}
