import { JsonRepository } from "../data/json-repository.js";
import { dataFilePath } from "../data/paths.js";
import type { NewsRecord } from "../models/news.js";

export interface NewsPostView {
  id: string;
  slug: string;
  kind: NewsRecord["kind"];
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  sourceName: string | null;
  eventDate: string | null;
  createdAt: string;
  body: string | null;
  published: boolean;
  sourceUrl: string | null;
  externalId: string | null;
  importedAt: string | null;
}

function serialize(record: NewsRecord): NewsPostView {
  return {
    id: record.id,
    slug: record.slug,
    kind: record.kind,
    title: record.title,
    excerpt: record.excerpt,
    imageUrl: record.imageUrl,
    sourceName: record.sourceName,
    eventDate: record.eventDate,
    createdAt: record.createdAt ?? new Date().toISOString(),
    body: record.body,
    published: record.published,
    sourceUrl: record.sourceUrl,
    externalId: record.externalId,
    importedAt: record.importedAt,
  };
}

export class NewsRepository {
  private readonly news = new JsonRepository<NewsRecord>(dataFilePath("news.json"));

  async list(kind?: NewsRecord["kind"]) {
    const items = await this.news.findAll({
      filter: (record) => record.published && (!kind || record.kind === kind),
      sort: { field: "createdAt", direction: "desc" },
    });
    return items.map(serialize);
  }

  async upcomingEvents(limit = 5) {
    const now = new Date();
    const items = await this.news.findAll({
      filter: (record) =>
        record.published &&
        record.kind === "EVENT" &&
        record.eventDate != null &&
        new Date(record.eventDate) >= now,
      sort: { field: "eventDate", direction: "asc" },
    });
    return items.slice(0, limit).map(serialize);
  }

  async detail(slug: string) {
    const items = await this.news.findAll({
      filter: (record) => record.slug === slug,
      sort: { field: "createdAt", direction: "desc" },
    });
    const current = items[0];
    if (!current || !current.published) return null;
    return serialize(current);
  }
}
