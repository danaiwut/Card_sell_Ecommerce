import { Controller, Get, Param, Query } from "@nestjs/common";
import { shopQuerySchema } from "@cardverse/shared";
import { ProductsService } from "./products.service";
import { Public } from "../auth/decorators";

@Controller()
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Public()
  @Get("home")
  home() {
    return this.products.home();
  }

  @Public()
  @Get("products")
  shop(@Query() query: Record<string, string>) {
    const parsed = shopQuerySchema.parse(query);
    return this.products.shop(parsed);
  }

  @Public()
  @Get("products/:slug")
  detail(@Param("slug") slug: string) {
    return this.products.detail(slug);
  }
}
