import { apiFetch } from "@/lib/api";

export async function confirmPasswordChangeToken(token: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/api/v1/confirm-password-change/${encodeURIComponent(token)}`,
    {
      method: "POST",
      service: "auth",
    },
  );
}
