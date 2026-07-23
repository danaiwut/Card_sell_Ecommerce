import { Module } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import { ProductReviewsService } from "./product-reviews.service";

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductReviewsService],
  exports: [ProductsService, ProductReviewsService],
})
export class ProductsModule {}
