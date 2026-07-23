import type { Request, Response } from "express";
import { z } from "zod";
import { NewsService } from "../services/news.service.js";

const newsQuerySchema = z.object({
  kind: z.enum(["NEWS", "EVENT", "SET_RELEASE", "PRICE_UPDATE"]).optional(),
});

export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  list = async (req: Request, res: Response) => {
    const query = newsQuerySchema.safeParse(req.query);
    res.json(await this.newsService.list(query.success ? query.data.kind : undefined));
  };

  upcomingEvents = async (_req: Request, res: Response) => {
    res.json(await this.newsService.upcomingEvents());
  };

  detail = async (req: Request, res: Response) => {
    const item = await this.newsService.detail(String(req.params.slug));
    if (!item) {
      res.status(404).json({ message: "News post not found" });
      return;
    }
    res.json(item);
  };
}
