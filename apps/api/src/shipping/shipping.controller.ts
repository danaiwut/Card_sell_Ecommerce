import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { updateShipmentSchema } from "@cardverse/shared";
import { ShippingService } from "./shipping.service";
import { CurrentUser, Roles } from "../auth/decorators";

@Controller("shipping")
export class ShippingController {
  constructor(private readonly shipping: ShippingService) {}

  @Post("marketplace/:orderId")
  updateMarketplace(
    @CurrentUser("id") sellerId: string,
    @Param("orderId") orderId: string,
    @Body() body: unknown,
  ) {
    return this.shipping.updateMarketplaceShipment(
      sellerId,
      orderId,
      updateShipmentSchema.parse(body),
    );
  }

  @Roles("manager", "admin")
  @Post("orders/:orderId")
  updateShop(@Param("orderId") orderId: string, @Body() body: unknown) {
    return this.shipping.updateShopShipment(orderId, updateShipmentSchema.parse(body));
  }
}
