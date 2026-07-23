import { createApp } from "./app.js";

const port = Number(process.env.LEGACY_BACKEND_PORT ?? 4001);

async function bootstrap() {
  const app = await createApp();
  app.listen(port, "0.0.0.0", () => {
    console.log(`CardVerse backend listening on port ${port}`);
  });
}

void bootstrap();
