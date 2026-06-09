import { apiFetchWithRefresh } from "@/lib/api";

export type ReportTargetType = "request" | "catalog_product";

export async function submitContentReport(input: {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
}): Promise<{ id: string; status: string }> {
  return apiFetchWithRefresh("/api/v1/moderation/reports", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export const REPORT_REASON_PRESETS = [
  "Prohibited or illegal content",
  "Spam or misleading information",
  "Fraud or scam",
  "Harassment or hate speech",
  "Other",
] as const;
