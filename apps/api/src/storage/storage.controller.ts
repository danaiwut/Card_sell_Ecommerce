import { Body, Controller, ForbiddenException, Post } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser, Roles } from "../auth/decorators";
import { StorageService } from "./storage.service";

const presignSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().positive(),
  folder: z.enum(["products", "catalog", "news", "avatars", "listings"]).optional(),
});

const ADMIN_FOLDERS = new Set(["products", "news"]);
const USER_FOLDERS = new Set(["catalog", "avatars", "listings"]);

@Controller("storage")
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post("presign")
  presign(@CurrentUser("id") userId: string, @CurrentUser("role") role: string, @Body() body: unknown) {
    const input = presignSchema.parse(body);
    const folder = input.folder ?? "products";

    if (ADMIN_FOLDERS.has(folder) && !["admin", "manager"].includes(role)) {
      throw new ForbiddenException("ไม่มีสิทธิ์อัปโหลดไฟล์นี้");
    }
    if (!ADMIN_FOLDERS.has(folder) && !USER_FOLDERS.has(folder)) {
      throw new ForbiddenException("โฟลเดอร์ไม่ถูกต้อง");
    }
    if (!userId) {
      throw new ForbiddenException("ต้องเข้าสู่ระบบก่อนอัปโหลด");
    }

    return this.storage.presignImageUpload({ ...input, folder });
  }
}
