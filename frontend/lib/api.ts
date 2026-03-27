const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4040";

let accessToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export type ApiError = {
  message?: string;
  errors?: { field: string; message: string }[];
};

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`) as Error & { status: number; data: ApiError };
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
  options: RequestInit = {},
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
