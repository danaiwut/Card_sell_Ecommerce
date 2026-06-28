import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
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
}
