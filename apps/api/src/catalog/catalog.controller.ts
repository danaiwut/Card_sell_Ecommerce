import { Controller, Get, Param, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { Public } from "../auth/decorators";

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get("categories")
  categories() {
    return this.catalog.listCategories();
  }

  @Public()
  @Get("catalog-items")
  catalogItems(
    @Query("q") q?: string,
    @Query("category") category?: string,
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "20",
  ) {
    return this.catalog.searchCatalogItems({
      q,
      category,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  }

  @Public()
  @Get("catalog-items/:slug")
  catalogItem(@Param("slug") slug: string) {
    return this.catalog.getCatalogItem(slug);
  }
}
