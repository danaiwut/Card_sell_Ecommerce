import type { Request, Response } from "express";
import { z } from "zod";
import { CatalogService } from "../services/catalog.service.js";
import { AppError } from "../middleware/error-handler.js";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(16),
});

const productQuerySchema = paginationSchema.extend({
  q: z.string().optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "popular"]).default("newest"),
});

const catalogQuerySchema = paginationSchema.extend({
  q: z.string().optional(),
  category: z.string().optional(),
});

export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  home = async (_req: Request, res: Response) => {
    res.json(await this.catalogService.home());
  };

  categories = async (_req: Request, res: Response) => {
    res.json(await this.catalogService.categories());
  };

  catalogOptions = async (_req: Request, res: Response) => {
    res.json(await this.catalogService.catalogOptions());
  };

  listCatalogItems = async (req: Request, res: Response) => {
    const query = catalogQuerySchema.parse(req.query);
    res.json(await this.catalogService.listCatalogItems(query));
  };

  getCatalogItem = async (req: Request, res: Response) => {
    const item = await this.catalogService.getCatalogItem(String(req.params.slug));
    if (!item) {
      throw new AppError(404, "Catalog item not found");
    }
    res.json(item);
  };

  listProducts = async (req: Request, res: Response) => {
    const query = productQuerySchema.parse(req.query);
    res.json(await this.catalogService.listProducts(query));
  };

  productDetail = async (req: Request, res: Response) => {
    const item = await this.catalogService.productDetail(String(req.params.slug));
    if (!item) {
      throw new AppError(404, "Product not found");
    }
    res.json(item);
  };
}
