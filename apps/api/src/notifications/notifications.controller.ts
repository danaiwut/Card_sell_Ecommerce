import { Controller, Get, Param, Post } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { CurrentUser } from "../auth/decorators";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser("id") userId: string) {
    return this.notifications.list(userId);
  }

  @Post(":id/read")
  read(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.notifications.markRead(userId, id);
  }

  @Post("read-all")
  readAll(@CurrentUser("id") userId: string) {
    return this.notifications.markAllRead(userId);
  }
}
