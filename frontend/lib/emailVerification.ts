import { apiFetch } from "@/lib/api";

export async function verifyEmailToken(token: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/verify-email/${encodeURIComponent(token)}`, {
    method: "POST",
    service: "auth",
  });
}

export async function resendVerificationEmail(email: string): Promise<{
  message?: string;
  verificationToken?: string;
}> {
  return apiFetch<{ message?: string; verificationToken?: string }>("/api/v1/send-verification-email", {
    method: "POST",
    service: "auth",
    body: JSON.stringify({ email }),
  });
}
