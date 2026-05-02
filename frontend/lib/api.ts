export type ServiceName = "auth" | "request" | "offer" | "chat" | "profile" | "admin" | "notification";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4040";

const SERVICE_URLS: Record<ServiceName, string> = {
  auth: process.env.NEXT_PUBLIC_AUTH_URL || API_URL,
  request: process.env.NEXT_PUBLIC_REQUEST_URL || API_URL,
  offer: process.env.NEXT_PUBLIC_OFFER_URL || API_URL,
  chat: process.env.NEXT_PUBLIC_CHAT_URL || API_URL,
  profile: process.env.NEXT_PUBLIC_PROFILE_URL || API_URL,
  admin: process.env.NEXT_PUBLIC_ADMIN_URL || API_URL,
  notification: process.env.NEXT_PUBLIC_NOTIFICATION_URL || API_URL,
};

let accessToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export type ApiError = {
  message?: string;
  error?: string;
  errors?: { field: string; message: string }[];
};

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { service?: ServiceName } = {},
): Promise<T> {
  const { service = "auth", ...fetchOptions } = options;
  const baseUrl = SERVICE_URLS[service];

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.message || data.error || `Request failed (${res.status})`;
    const err = new Error(msg) as Error & { status: number; data: ApiError };
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const data = await apiFetch<{ accessToken: string }>("/api/v1/auth/refresh", {
      method: "POST",
      service: "auth",
    });
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export async function apiFetchWithRefresh<T = unknown>(
  path: string,
  options: RequestInit & { service?: ServiceName } = {},
): Promise<T> {
  try {
    return await apiFetch<T>(path, options);
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    if (error.status === 401 || error.status === 403) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return await apiFetch<T>(path, options);
      }
    }
    throw err;
  }
}
