export type ServiceName = "auth" | "request" | "offer" | "chat" | "profile" | "admin" | "notification";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4040";

const ACCESS_TOKEN_STORAGE_KEY = "mollmart_access_token";

let accessToken: string | null = null;

if (typeof window !== "undefined") {
  try {
    const stored = sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (stored) accessToken = stored;
  } catch {
    // ignore private mode / blocked storage
  }
}

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window === "undefined") return;
  try {
    if (token) sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    else sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Coalesces concurrent refresh calls (avoids double rotation / 403 under React Strict Mode). */
let refreshInFlight: Promise<string | null> | null = null;

export type ApiError = {
  message?: string;
  error?: string;
  errors?: { field: string; message: string }[];
};

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { service?: ServiceName } = {},
): Promise<T> {
  const fetchOptions: RequestInit & { service?: ServiceName } = { ...options };
  delete fetchOptions.service;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
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
  if (refreshInFlight != null) {
    return refreshInFlight;
  }
  refreshInFlight = (async () => {
    try {
      const data = await apiFetch<{ accessToken: string }>("/api/v1/auth/refresh", {
        method: "POST",
      });
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
      // Do not clear storage here: cookie refresh can fail cross-origin while JWT is still valid.
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
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
      await refreshAccessToken();
      if (getAccessToken()) {
        return await apiFetch<T>(path, options);
      }
    }
    throw err;
  }
}
