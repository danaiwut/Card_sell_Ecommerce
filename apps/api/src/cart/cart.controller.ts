import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { addToCartSchema } from "@cardverse/shared";
import { CartService } from "./cart.service";
import { CurrentUser } from "../auth/decorators";

@Controller("cart")
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@CurrentUser("id") userId: string) {
    return this.cart.get(userId);
  }

  @Post("items")
  add(@CurrentUser("id") userId: string, @Body() body: unknown) {
    const { productId, quantity } = addToCartSchema.parse(body);
    return this.cart.add(userId, productId, quantity);
  }

  @Patch("items/:id")
  update(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() body: { quantity: number },
  ) {
    return this.cart.setQuantity(userId, id, body.quantity);
  }

  @Delete("items/:id")
  remove(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.cart.remove(userId, id);
  }

  @Delete()
  clear(@CurrentUser("id") userId: string) {
    return this.cart.clear(userId);
  }
}
