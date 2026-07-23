import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { HealthController } from "./controllers/health.controller.js";
import { CategoryController } from "./controllers/category.controller.js";
import { CatalogController } from "./controllers/catalog.controller.js";
import { NewsController } from "./controllers/news.controller.js";
import { CategoryRepository } from "./repositories/category.repository.js";
import { CatalogRepository } from "./repositories/catalog.repository.js";
import { NewsRepository } from "./repositories/news.repository.js";
import { CategoryService } from "./services/category.service.js";
import { CatalogService } from "./services/catalog.service.js";
import { NewsService } from "./services/news.service.js";
import { createHealthRouter } from "./routes/health.routes.js";
import { createCategoryRouter } from "./routes/category.routes.js";
import { createCatalogRouter } from "./routes/catalog.routes.js";
import { createNewsRouter } from "./routes/news.routes.js";
import { bootstrapJsonData } from "./data/bootstrap.js";
import { AppError, errorHandler } from "./middleware/error-handler.js";

export async function createApp(): Promise<Express> {
  await bootstrapJsonData();

  const app = express();
  const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const categoryRepository = new CategoryRepository();
  const catalogRepository = new CatalogRepository(categoryRepository);
  const newsRepository = new NewsRepository();
  const categoryService = new CategoryService(categoryRepository);
  const catalogService = new CatalogService(catalogRepository, categoryRepository);
  const newsService = new NewsService(newsRepository);
  const healthController = new HealthController();
  const categoryController = new CategoryController(categoryService);
  const catalogController = new CatalogController(catalogService);
  const newsController = new NewsController(newsService);

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(morgan("dev"));
  app.use(express.json({ limit: "2mb" }));

  const router = express.Router();
  router.use(createHealthRouter(healthController));
  router.use(createCategoryRouter(categoryController));
  router.use(createCatalogRouter(catalogController));
  router.use(createNewsRouter(newsController));

  app.use(router);
  app.use("/backend", router);
  app.use((_req, _res, next) => {
    next(new AppError(404, "Route not found"));
  });
  app.use(errorHandler);

  return app;
}
