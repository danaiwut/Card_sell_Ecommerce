import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import type { NewsKind } from "@cardverse/shared";
import { NewsService } from "./news.service";
import { CurrentUser, Public, Roles } from "../auth/decorators";

@Controller("news")
export class NewsController {
  constructor(private readonly news: NewsService) {}

  @Public()
  @Get()
  list(@Query("kind") kind?: NewsKind) {
    return this.news.list(kind);
  }

  @Public()
  @Get("events/upcoming")
  upcoming() {
    return this.news.upcomingEvents();
  }

  @Roles("manager", "admin")
  @Get("admin")
  listAdmin(@Query("status") status?: "draft" | "published") {
    return this.news.listAdmin(status);
  }

  @Public()
  @Get(":slug")
  detail(@Param("slug") slug: string) {
    return this.news.detail(slug);
  }

  @Roles("manager", "admin")
  @Post()
  create(@CurrentUser("id") authorId: string, @Body() body: any) {
    return this.news.create(authorId, body);
  }

  @Roles("manager", "admin")
  @Patch(":id")
  update(@Param("id") id: string, @Body() body: any) {
    return this.news.update(id, body);
  }

  @Roles("manager", "admin")
  @Post(":id/publish")
  publish(@Param("id") id: string) {
    return this.news.publish(id);
  }

  @Roles("manager", "admin")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.news.delete(id);
  }
}

