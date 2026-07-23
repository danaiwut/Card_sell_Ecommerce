import { CategoryRepository } from "../repositories/category.repository.js";
import { CatalogRepository } from "../repositories/catalog.repository.js";

export class CatalogService {
  constructor(
    private readonly catalogRepository: CatalogRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async categories() {
    return this.categoryRepository.listCategories();
  }

  async catalogOptions() {
    return this.categoryRepository.listCatalogOptions();
  }

  async listCatalogItems(params: {
    q?: string;
    category?: string;
    page: number;
    pageSize: number;
  }) {
    return this.catalogRepository.listCatalogItems(params);
  }

  async getCatalogItem(slugOrId: string) {
    return this.catalogRepository.getCatalogItem(slugOrId);
  }

  async createCatalogItem(input: {
    name: string;
    categoryId: string;
    subcategoryId?: string;
    brandId?: string;
    setId?: string;
    rarity?: import("@cardverse/shared").Rarity;
    cardNumber?: string;
    imageUrl?: string;
    images?: string[];
  }) {
    return this.catalogRepository.createCatalogItem(input);
  }

  async home() {
    return this.catalogRepository.home();
  }

  async listProducts(query: {
    q?: string;
    category?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    page: number;
    pageSize: number;
    sort?: "newest" | "price_asc" | "price_desc" | "popular";
  }) {
    return this.catalogRepository.listProducts(query);
  }

  async productDetail(slug: string) {
    return this.catalogRepository.detail(slug);
  }
}
