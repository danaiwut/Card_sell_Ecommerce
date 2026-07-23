import { CATALOG_TAXONOMY } from "@cardverse/shared";
import { JsonRepository } from "./json-repository.js";
import { dataFilePath } from "./paths.js";
import { createEntityId } from "../utils/id.js";
import type {
  BrandRecord,
  CardSetRecord,
  CategoryRecord,
  SettingRecord,
  SubcategoryRecord,
} from "../models/taxonomy.js";

const NOW = new Date("2026-07-23T00:00:00.000Z").toISOString();

function createCategorySeed(): CategoryRecord[] {
  return CATALOG_TAXONOMY.map((category, index) => ({
    id: createEntityId("cat", category.slug),
    slug: category.slug,
    name: category.name,
    nameTh: category.nameTh,
    emoji: category.emoji,
    note: category.note ?? null,
    sortOrder: index,
    createdAt: NOW,
    updatedAt: NOW,
  }));
}

function createSubcategorySeed(categories: CategoryRecord[]): SubcategoryRecord[] {
  return CATALOG_TAXONOMY.flatMap((category) => {
    const categoryRecord = categories.find((item) => item.slug === category.slug);
    if (!categoryRecord) return [];
    return category.subcategories.map((subcategory) => ({
      id: createEntityId("sub", `${category.slug}/${subcategory.slug}`),
      categoryId: categoryRecord.id,
      slug: subcategory.slug,
      name: subcategory.name,
      createdAt: NOW,
      updatedAt: NOW,
    }));
  });
}

function createSettingsSeed(): SettingRecord[] {
  return [
    {
      id: createEntityId("setting", "site-name"),
      key: "site-name",
      value: "CardVerse",
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: createEntityId("setting", "site-description"),
      key: "site-description",
      value: "Collectible card marketplace",
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: createEntityId("setting", "marketplace-fee-percent"),
      key: "marketplace-fee-percent",
      value: 8,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: createEntityId("setting", "escrow-auto-release-days"),
      key: "escrow-auto-release-days",
      value: 7,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: createEntityId("setting", "maintenance-mode"),
      key: "maintenance-mode",
      value: false,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];
}

async function seedFile<T extends { id: string }>(
  repository: JsonRepository<T>,
  records: readonly T[],
) {
  await repository.seedIfEmpty(records);
}

export async function bootstrapJsonData() {
  const categories = new JsonRepository<CategoryRecord>(dataFilePath("categories.json"));
  const subcategories = new JsonRepository<SubcategoryRecord>(dataFilePath("subcategories.json"));
  const brands = new JsonRepository<BrandRecord>(dataFilePath("brands.json"));
  const cardSets = new JsonRepository<CardSetRecord>(dataFilePath("card-sets.json"));
  const settings = new JsonRepository<SettingRecord>(dataFilePath("settings.json"));

  await seedFile(categories, createCategorySeed());
  const seededCategories = await categories.findAll({
    sort: { field: "sortOrder", direction: "asc" },
  });
  await seedFile(subcategories, createSubcategorySeed(seededCategories));
  await seedFile(brands, []);
  await seedFile(cardSets, []);
  await seedFile(settings, createSettingsSeed());

  const emptyFiles = [
    "users.json",
    "products.json",
    "catalog-items.json",
    "orders.json",
    "cart.json",
    "wishlist.json",
    "reviews.json",
    "notifications.json",
    "messages.json",
    "wallets.json",
    "transactions.json",
    "listings.json",
    "offers.json",
    "shipments.json",
    "top-up-requests.json",
    "withdrawal-requests.json",
    "trades.json",
    "price-points.json",
    "addresses.json",
  ] as const;

  await Promise.all(
    emptyFiles.map(async (fileName) => {
      await new JsonRepository<{ id: string }>(dataFilePath(fileName)).seedIfEmpty([]);
    }),
  );
}
