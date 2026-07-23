import { JsonClient, PrismaClient } from "./json-client";
import { bootstrapJsonData } from "./bootstrap";

export { JsonClient, PrismaClient, bootstrapJsonData };
export * from "./models";
export * from "./types";
export { getDataDir, dataFilePath } from "./paths";

const globalForDb = globalThis as unknown as {
  prisma: JsonClient | undefined;
};

export const prisma =
  globalForDb.prisma ??
  new JsonClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.prisma = prisma;
}
