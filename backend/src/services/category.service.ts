import { CategoryRepository } from "../repositories/category.repository.js";

export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async listCategories() {
    return this.categoryRepository.listCategories();
  }

  async catalogOptions() {
    return this.categoryRepository.listCatalogOptions();
  }
}
