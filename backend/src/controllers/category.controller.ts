import type { Request, Response } from "express";
import { CategoryService } from "../services/category.service.js";

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  listCategories = async (_req: Request, res: Response) => {
    const categories = await this.categoryService.listCategories();
    res.json(categories);
  };

  catalogOptions = async (_req: Request, res: Response) => {
    const options = await this.categoryService.catalogOptions();
    res.json(options);
  };
}
