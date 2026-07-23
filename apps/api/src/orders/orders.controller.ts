import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { productReviewSchema } from "@cardverse/shared";
import { OrdersService } from "./orders.service";
import { ProductReviewsService } from "../products/product-reviews.service";
import { CurrentUser } from "../auth/decorators";

@Controller("orders")
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly productReviews: ProductReviewsService,
  ) {}

  @Post("checkout")
  checkout(
    @CurrentUser("id") userId: string,
    @Body()
    body: {
      addressId?: string;
      couponCode?: string;
      shipping?: number;
      payWithCredit?: boolean;
      cartItemIds?: string[];
    },
  ) {
    return this.orders.checkout(userId, body);
  }

  @Get()
  list(@CurrentUser("id") userId: string) {
    return this.orders.listMine(userId);
  }

  @Get(":id/shipment")
  shipment(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.orders.getShipment(userId, id);
  }

  @Get(":id")
  get(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.orders.get(userId, id);
  }

  @Delete(":id")
  cancel(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.orders.cancel(userId, id);
  }

  @Post(":id/items/:itemId/review")
  reviewItem(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body() body: unknown,
  ) {
    const data = productReviewSchema.parse(body);
    return this.productReviews.submit(userId, id, itemId, data);
  }
}
