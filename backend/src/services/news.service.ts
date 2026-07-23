import { NewsRepository } from "../repositories/news.repository.js";
import type { NewsKind } from "@cardverse/shared";

export class NewsService {
  constructor(private readonly newsRepository: NewsRepository) {}

  async list(kind?: NewsKind) {
    return this.newsRepository.list(kind);
  }

  async upcomingEvents(limit = 5) {
    return this.newsRepository.upcomingEvents(limit);
  }

  async detail(slug: string) {
    return this.newsRepository.detail(slug);
  }
}
