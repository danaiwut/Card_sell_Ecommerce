import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { addressSchema } from "@cardverse/shared";
import { parseZod } from "../common/parse-zod";
import { UsersService } from "./users.service";
import { CurrentUser } from "../auth/decorators";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  me(@CurrentUser("id") userId: string) {
    return this.users.me(userId);
  }

  @Patch("me")
  update(
    @CurrentUser("id") userId: string,
    @Body() body: { displayName?: string; avatarUrl?: string },
  ) {
    return this.users.updateProfile(userId, body);
  }

  @Get("me/addresses")
  addresses(@CurrentUser("id") userId: string) {
    return this.users.addresses(userId);
  }

  @Post("me/addresses")
  addAddress(@CurrentUser("id") userId: string, @Body() body: unknown) {
    return this.users.addAddress(userId, parseZod(addressSchema, body));
  }

  @Patch("me/addresses/:id")
  updateAddress(
    @CurrentUser("id") userId: string,
    @Param("id") addressId: string,
    @Body() body: unknown,
  ) {
    return this.users.updateAddress(userId, addressId, parseZod(addressSchema.partial(), body));
  }

  @Delete("me/addresses/:id")
  deleteAddress(@CurrentUser("id") userId: string, @Param("id") addressId: string) {
    return this.users.deleteAddress(userId, addressId);
  }
}
