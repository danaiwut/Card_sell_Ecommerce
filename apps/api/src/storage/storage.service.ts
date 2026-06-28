import { BadRequestException, Injectable } from "@nestjs/common";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
  private readonly client: S3Client | null;
  private readonly bucket = process.env.R2_BUCKET;
  private readonly publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    this.client =
      accountId && accessKeyId && secretAccessKey
        ? new S3Client({
            region: "auto",
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId, secretAccessKey },
          })
        : null;
  }

  async presignImageUpload(input: {
    fileName: string;
    contentType: string;
    size: number;
    folder?: "products" | "catalog" | "news" | "avatars";
  }) {
    if (!this.client || !this.bucket || !this.publicUrl) {
      throw new BadRequestException(
        "R2 storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, and R2_PUBLIC_URL.",
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

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: input.contentType,
      ContentLength: input.size,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 60 * 5 });

    return {
      key,
      uploadUrl,
      publicUrl: `${this.publicUrl}/${key}`,
      expiresIn: 300,
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
