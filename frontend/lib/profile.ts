import { apiFetchWithRefresh } from "@/lib/api";

export async function uploadProfileAvatar(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const data = await apiFetchWithRefresh<{ url: string }>("/api/v1/profiles/me/avatar", {
    method: "POST",
    body,
    service: "profile",
  });
  if (!data.url) {
    throw new Error("Upload did not return a URL");
  }
  return data.url;
}
