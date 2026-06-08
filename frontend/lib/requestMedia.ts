import { resolveUploadedAssetUrl } from "@/lib/api";

export function firstAttachmentImageUrl(attachments: unknown): string | undefined {
  if (!Array.isArray(attachments) || attachments.length === 0) return undefined;
  const first = attachments[0];
  let raw: string | undefined;
  if (typeof first === "string") {
    raw = first.trim() || undefined;
  } else if (first && typeof first === "object") {
    const o = first as Record<string, unknown>;
    const v = o.fileUrl ?? o.file_url;
    raw = v != null ? String(v).trim() : undefined;
  }
  return resolveUploadedAssetUrl(raw);
}
