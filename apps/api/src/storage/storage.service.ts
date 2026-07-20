import { BadRequestException, Injectable } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE = 8 * 1024 * 1024;

@Injectable()
export class StorageService {
  private readonly client: SupabaseClient | null;
  private readonly bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "cardverse";
  private readonly supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");

  constructor() {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    this.client =
      url && serviceKey ? createClient(url, serviceKey, { auth: { persistSession: false } }) : null;
  }

  async presignImageUpload(input: {
    fileName: string;
    contentType: string;
    size: number;
    folder?: "products" | "catalog" | "news" | "avatars" | "listings";
  }) {
    if (!this.client || !this.supabaseUrl) {
      throw new BadRequestException(
        "Supabase storage is not configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET.",
      );
    }

    if (!ALLOWED_IMAGE_TYPES.has(input.contentType)) {
      throw new BadRequestException("รองรับเฉพาะไฟล์รูปภาพ jpeg, png, webp หรือ gif");
    }

    if (!Number.isFinite(input.size) || input.size <= 0 || input.size > MAX_FILE_SIZE) {
      throw new BadRequestException("ไฟล์รูปต้องมีขนาดไม่เกิน 8MB");
    }

    const extension = this.extensionFrom(input.fileName, input.contentType);
    const folder = input.folder ?? "products";
    const key = `${folder}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`;

    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUploadUrl(key);

    if (error || !data) {
      throw new BadRequestException(error?.message ?? "Failed to create upload URL");
    }

    return {
      key,
      uploadUrl: data.signedUrl,
      publicUrl: `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${key}`,
      expiresIn: 7200,
    };
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
