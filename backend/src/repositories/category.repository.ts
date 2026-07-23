import { JsonRepository } from "../data/json-repository.js";
import { dataFilePath } from "../data/paths.js";
import type {
  BrandRecord,
  CardSetRecord,
  CategoryRecord,
  SubcategoryRecord,
} from "../models/taxonomy.js";

export interface CategoryView {
  id: string;
  slug: string;
  name: string;
  nameTh: string;
  emoji: string;
  note: string | null;
  subcategories: { id: string; slug: string; name: string }[];
}

export interface CatalogOptions {
  categories: Array<Pick<CategoryView, "id" | "slug" | "name" | "nameTh" | "emoji">>;
  subcategories: Array<{ id: string; categoryId: string; slug: string; name: string }>;
  brands: Array<{ id: string; categoryId: string | null; slug: string; name: string }>;
  sets: Array<{ id: string; slug: string; name: string; releaseDate: string | null }>;
}

export class CategoryRepository {
  private readonly categories = new JsonRepository<CategoryRecord>(dataFilePath("categories.json"));
  private readonly subcategories = new JsonRepository<SubcategoryRecord>(dataFilePath("subcategories.json"));
  private readonly brands = new JsonRepository<BrandRecord>(dataFilePath("brands.json"));
  private readonly cardSets = new JsonRepository<CardSetRecord>(dataFilePath("card-sets.json"));

  async listCategories(): Promise<CategoryView[]> {
    const [categories, subcategories] = await Promise.all([
      this.categories.findAll({ sort: { field: "sortOrder", direction: "asc" } }),
      this.subcategories.findAll({ sort: { field: "name", direction: "asc" } }),
    ]);

    return categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      nameTh: category.nameTh,
      emoji: category.emoji,
      note: category.note,
      subcategories: subcategories
        .filter((subcategory) => subcategory.categoryId === category.id)
        .map((subcategory) => ({
          id: subcategory.id,
          slug: subcategory.slug,
          name: subcategory.name,
        })),
    }));
  }

  async listCatalogOptions(): Promise<CatalogOptions> {
    const [categories, subcategories, brands, sets] = await Promise.all([
      this.categories.findAll({ sort: { field: "sortOrder", direction: "asc" } }),
      this.subcategories.findAll({ sort: { field: "name", direction: "asc" } }),
      this.brands.findAll({ sort: { field: "name", direction: "asc" } }),
      this.cardSets.findAll({ sort: { field: "name", direction: "asc" } }),
    ]);

    return {
      categories: categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
        nameTh: category.nameTh,
        emoji: category.emoji,
      })),
      subcategories: subcategories.map((subcategory) => ({
        id: subcategory.id,
        categoryId: subcategory.categoryId,
        slug: subcategory.slug,
        name: subcategory.name,
      })),
      brands: brands.map((brand) => ({
        id: brand.id,
        categoryId: brand.categoryId,
        slug: brand.slug,
        name: brand.name,
      })),
      sets: sets.map((set) => ({
        id: set.id,
        slug: set.slug,
        name: set.name,
        releaseDate: set.releaseDate,
      })),
    };
  }

  async findCategoryById(id: string): Promise<CategoryRecord | null> {
    return this.categories.findById(id);
  }

  async findSubcategoryById(id: string): Promise<SubcategoryRecord | null> {
    return this.subcategories.findById(id);
  }

  async findBrandById(id: string): Promise<BrandRecord | null> {
    return this.brands.findById(id);
  }

  async findSetById(id: string): Promise<CardSetRecord | null> {
    return this.cardSets.findById(id);
  }
}
