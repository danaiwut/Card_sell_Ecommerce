import { seedJsonData } from "./seed-data";

export async function bootstrapJsonData(): Promise<void> {
  await seedJsonData({ preserveUsers: true, ifEmpty: true });
}
