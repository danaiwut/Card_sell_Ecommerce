import { api } from "./api";

interface PresignResponse {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  expiresIn: number;
}

export async function uploadImage(
  file: File,
  folder: "products" | "catalog" | "news" | "avatars" = "products",
) {
  const presign = await api.post<PresignResponse>("/storage/presign", {
    fileName: file.name,
    contentType: file.type,
    size: file.size,
    folder,
  });

  const upload = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!upload.ok) {
    throw new Error(`Upload failed: ${upload.status}`);
  }

  return presign.publicUrl;
}
