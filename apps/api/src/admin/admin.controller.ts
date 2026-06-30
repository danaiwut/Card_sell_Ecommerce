import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import type { Role } from "@cardverse/shared";
import { AdminService } from "./admin.service";
import { Roles } from "../auth/decorators";

@Roles("manager", "admin")
@Controller("admin")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // --- Manager + Admin ---
  @Get("products")
  products() {
    return this.admin.listProducts();
  }

  @Post("products")
  createProduct(@Body() body: any) {
    return this.admin.createProduct(body);
  }

  @Patch("products/:id")
  updateProduct(@Param("id") id: string, @Body() body: any) {
    return this.admin.updateProduct(id, body);
  }

  @Delete("products/:id")
  deleteProduct(@Param("id") id: string) {
    return this.admin.deleteProduct(id);
  }

  @Post("catalog-items")
  createCatalogItem(@Body() body: any) {
    return this.admin.createCatalogItem(body);
  }

  @Get("catalog-options")
  catalogOptions() {
    return this.admin.catalogOptions();
  }

  @Get("orders")
  orders() {
    return this.admin.listShopOrders();
  }

  @Get("marketplace-orders")
  marketplaceOrders() {
    return this.admin.listMarketplaceOrders();
  }

  @Get("shipping-queue")
  shippingQueue() {
    return this.admin.shippingQueue();
  }

  @Post("shipping/:kind/:id")
  updateShipment(
    @Param("kind") kind: "shop" | "marketplace",
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.admin.updateShipment(kind, id, body);
  }

  @Post("listings/:id/suspend")
  suspend(@Param("id") id: string) {
    return this.admin.suspendListing(id);
  }

  @Get("disputes")
  disputes() {
    return this.admin.listDisputes();
  }

  @Get("reports")
  reports() {
    return this.admin.reports();
  }

  // --- Admin only ---
  @Roles("admin")
  @Get("users")
  users() {
    return this.admin.listUsers();
  }

  @Roles("admin")
  @Patch("users/:id/role")
  setRole(@Param("id") id: string, @Body() body: { role: Role }) {
    return this.admin.setUserRole(id, body.role);
  }

  @Roles("admin")
  @Post("orders/:id/refund")
  refund(@Param("id") id: string) {
    return this.admin.refundMarketplaceOrder(id);
  }

  @Roles("admin")
  @Get("settings")
  settings() {
    return this.admin.getSettings();
  }

  @Roles("admin")
  @Post("settings")
  setSetting(@Body() body: { key: string; value: unknown }) {
    return this.admin.setSetting(body.key, body.value);
  }
}
