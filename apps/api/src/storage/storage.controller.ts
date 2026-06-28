import { Body, Controller, Post } from "@nestjs/common";
import { z } from "zod";
import { Roles } from "../auth/decorators";
import { StorageService } from "./storage.service";

const presignSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().positive(),
  folder: z.enum(["products", "catalog", "news", "avatars"]).optional(),
});

@Roles("manager", "admin")
@Controller("storage")
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post("presign")
  presign(@Body() body: unknown) {
    return this.storage.presignImageUpload(presignSchema.parse(body));
  }
}
