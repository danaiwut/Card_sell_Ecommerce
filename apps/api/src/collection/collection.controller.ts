import { Body, Controller, Get, Post } from "@nestjs/common";
import { CollectionService } from "./collection.service";
import { CurrentUser } from "../auth/decorators";

@Controller("collection")
export class CollectionController {
  constructor(private readonly collection: CollectionService) {}

  @Get("overview")
  overview(@CurrentUser("id") userId: string) {
    return this.collection.overview(userId);
  }

  @Get("cards")
  cards(@CurrentUser("id") userId: string) {
    return this.collection.myCards(userId);
  }

  @Post("cards")
  add(@CurrentUser("id") userId: string, @Body() body: { catalogItemId: string }) {
    return this.collection.addToCollection(userId, body.catalogItemId);
  }
}
