import { NestFactory, Reflector } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { json, raw } from "express";
import { AppModule } from "./app.module";
import { PublicCacheInterceptor } from "./common/public-cache.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: false });

  // Stripe webhooks need the raw body for signature verification.
  app.use("/payments/webhook", raw({ type: "*/*" }));
  app.use(json({ limit: "2mb" }));

  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(","),
    credentials: true,
  });

  app.useGlobalInterceptors(new PublicCacheInterceptor(app.get(Reflector)));

  // Request validation is handled per-route with zod schemas (see controllers),
  // so no global class-validator ValidationPipe is needed.

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
  Logger.log(`CardVerse API listening on port ${port}`, "Bootstrap");
}

bootstrap();
