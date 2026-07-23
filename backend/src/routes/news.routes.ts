import { Router } from "express";
import { NewsController } from "../controllers/news.controller.js";

export function createNewsRouter(controller: NewsController): Router {
  const router = Router();
  router.get("/news", controller.list);
  router.get("/news/events/upcoming", controller.upcomingEvents);
  router.get("/news/:slug", controller.detail);
  return router;
}
