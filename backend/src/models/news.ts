import type { JsonRecord } from "../types/json.js";
import type { NewsKind } from "@cardverse/shared";

export interface NewsRecord extends JsonRecord {
  slug: string;
  kind: NewsKind;
  title: string;
  excerpt: string | null;
  body: string | null;
  imageUrl: string | null;
  published: boolean;
  eventDate: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  externalId: string | null;
  importedAt: string | null;
}
