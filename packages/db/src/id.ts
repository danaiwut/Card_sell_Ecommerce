import { createHash, randomUUID } from "node:crypto";

export function createEntityId(prefix: string, seed?: string): string {
  if (!seed) {
    return `${prefix}_${randomUUID()}`;
  }
  const digest = createHash("sha1").update(seed).digest("hex").slice(0, 16);
  return `${prefix}_${digest}`;
}

export function newId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 24);
}
