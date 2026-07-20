import { BadRequestException } from "@nestjs/common";
import type { ZodSchema } from "zod";

export function parseZod<T>(schema: ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => {
        const path = issue.path.length ? issue.path.join(".") : "body";
        return `${path}: ${issue.message}`;
      })
      .join("; ");
    throw new BadRequestException(message);
  }
  return result.data;
}
