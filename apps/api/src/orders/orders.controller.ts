import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { CurrentUser } from "../auth/decorators";

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post("checkout")
  checkout(
    @CurrentUser("id") userId: string,
    @Body() body: { addressId?: string; couponCode?: string },
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
}
