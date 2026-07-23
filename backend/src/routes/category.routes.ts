import { Router } from "express";
import { CategoryController } from "../controllers/category.controller.js";

export function createCategoryRouter(controller: CategoryController): Router {
  const router = Router();
  router.get("/categories", controller.listCategories);
  router.get("/catalog-options", controller.catalogOptions);
  router.get("/admin/catalog-options", controller.catalogOptions);
  return router;
}
