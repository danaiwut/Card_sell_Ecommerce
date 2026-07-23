import type { JsonRecord } from "../types/json.js";

export interface CategoryRecord extends JsonRecord {
  slug: string;
  name: string;
  nameTh: string;
  emoji: string;
  note: string | null;
  sortOrder: number;
}

export interface SubcategoryRecord extends JsonRecord {
  categoryId: string;
  slug: string;
  name: string;
}

export interface BrandRecord extends JsonRecord {
  categoryId: string | null;
  slug: string;
  name: string;
}

export interface CardSetRecord extends JsonRecord {
  slug: string;
  name: string;
  releaseDate: string | null;
}

export interface SettingRecord extends JsonRecord {
  key: string;
  value: unknown;
}
