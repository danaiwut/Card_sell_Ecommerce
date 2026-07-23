import { Router } from "express";
import { HealthController } from "../controllers/health.controller.js";

export function createHealthRouter(controller: HealthController): Router {
  const router = Router();
  router.get("/", (_req, res) => res.json(controller.root()));
  router.get("/health", (_req, res) => res.json(controller.health()));
  return router;
}
