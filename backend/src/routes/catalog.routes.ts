import { Router } from "express";
import { CatalogController } from "../controllers/catalog.controller.js";

export function createCatalogRouter(controller: CatalogController): Router {
  const router = Router();
  router.get("/", controller.home);
  router.get("/home", controller.home);
  router.get("/categories", controller.categories);
  router.get("/catalog-options", controller.catalogOptions);
  router.get("/admin/catalog-options", controller.catalogOptions);
  router.get("/catalog-items", controller.listCatalogItems);
  router.get("/catalog-items/:slug", controller.getCatalogItem);
  router.get("/products", controller.listProducts);
  router.get("/products/:slug", controller.productDetail);
  return router;
}
