import { BadRequestException, Injectable } from "@nestjs/common";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE = 8 * 1024 * 1024;

@Injectable()
export class StorageService {
  private readonly uploadDir: string;
  private readonly apiUrl: string;
  private readonly uploadSecret: string;

  constructor() {
    this.uploadDir = path.resolve(process.env.LOCAL_UPLOAD_DIR ?? "./data/uploads");
    this.apiUrl = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");
    this.uploadSecret = process.env.INTERNAL_API_SECRET ?? "dev-internal-secret";
  }

  async presignImageUpload(input: {
    fileName: string;
    contentType: string;
    size: number;
    folder?: "products" | "catalog" | "news" | "avatars" | "listings";
  }) {
    if (!ALLOWED_IMAGE_TYPES.has(input.contentType)) {
      throw new BadRequestException("รองรับเฉพาะไฟล์รูปภาพ jpeg, png, webp หรือ gif");
    }

    if (!Number.isFinite(input.size) || input.size <= 0 || input.size > MAX_FILE_SIZE) {
      throw new BadRequestException("ไฟล์รูปต้องมีขนาดไม่เกิน 8MB");
    }

    const extension = this.extensionFrom(input.fileName, input.contentType);
    const folder = input.folder ?? "products";
    const key = `${folder}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`;
    const token = this.signUpload(key, input.contentType, input.size);
    const uploadUrl = `${this.apiUrl}/storage/upload/${encodeURIComponent(key)}?token=${encodeURIComponent(token)}`;

    return {
      key,
      uploadUrl,
      publicUrl: `${this.apiUrl}/uploads/${key}`,
      expiresIn: 7200,
    };
  }

  async saveUpload(
    key: string,
    token: string,
    contentType: string,
    body: Buffer,
  ): Promise<{ key: string; publicUrl: string }> {
    this.verifyUploadToken(key, token, contentType, body.length);
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      throw new BadRequestException("รองรับเฉพาะไฟล์รูปภาพ jpeg, png, webp หรือ gif");
    }
    if (body.length > MAX_FILE_SIZE) {
      throw new BadRequestException("ไฟล์รูปต้องมีขนาดไม่เกิน 8MB");
    }
    if (key.includes("..") || key.startsWith("/")) {
      throw new BadRequestException("Invalid upload key");
    }

    const filePath = path.join(this.uploadDir, key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, body);

    return {
      key,
      publicUrl: `${this.apiUrl}/uploads/${key}`,
    };
  }

  getUploadPath(key: string): string {
    if (key.includes("..") || key.startsWith("/")) {
      throw new BadRequestException("Invalid upload key");
    }
    return path.join(this.uploadDir, key);
  }

  private signUpload(key: string, contentType: string, size: number): string {
    const payload = `${key}|${contentType}|${size}`;
    return createHmac("sha256", this.uploadSecret).update(payload).digest("hex");
  }

  private verifyUploadToken(key: string, token: string, contentType: string, size: number) {
    const expected = this.signUpload(key, contentType, size);
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new BadRequestException("Invalid or expired upload token");
    }
  }

  private extensionFrom(fileName: string, contentType: string) {
    const ext = fileName.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase();
    if (ext && [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) return ext;

    switch (contentType) {
      case "image/png":
        return ".png";
      case "image/webp":
        return ".webp";
      case "image/gif":
        return ".gif";
      default:
        return ".jpg";
    }
  }
}
