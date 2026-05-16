export type ServiceName =
  | "auth"
  | "request"
  | "offer"
  | "chat"
  | "profile"
  | "admin"
  | "notification"
  | "catalog"
  | "deal";

const configuredApiBase = process.env.NEXT_PUBLIC_API_URL;

if (process.env.NODE_ENV === "production" && !configuredApiBase) {
  throw new Error("NEXT_PUBLIC_API_URL is required in production.");
}

export const API_BASE = (configuredApiBase || "http://localhost:4040").replace(/\/$/, "");

/** Use for `<img src>` when the API stores a site-relative upload path (e.g. `/uploads/catalog/...`). */
export function resolveUploadedAssetUrl(href: string | undefined | null): string | undefined {
  const s = (href ?? "").trim();
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return s;
  if (s.startsWith("/")) {
    return `${API_BASE}${s}`;
  }
  return s;
}

const ACCESS_TOKEN_STORAGE_KEY = "mollmart_access_token";

let accessToken: string | null = null;

/** Set from WorkspaceProvider so API requests use the correct buyer/seller mode. */
let activeModeHeaderProvider: (() => string | null) | null = null;

export function setActiveModeHeaderProvider(provider: (() => string | null) | null) {
  activeModeHeaderProvider = provider;
}

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

export type ApiFetchOptions = RequestInit & {
  service?: ServiceName;
  /** Overrides workspace header for this request (e.g. PATCH seller profile while UI is in buyer mode). */
  activeMode?: "buyer" | "seller";
};

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { activeMode: activeModeOverride, service: _service, ...fetchOptions } = options;

  const isFormData =
    typeof FormData !== "undefined" && fetchOptions.body != null && fetchOptions.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!isFormData && headers["Content-Type"] == null) {
    headers["Content-Type"] = "application/json";
  }

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const activeMode = activeModeOverride ?? activeModeHeaderProvider?.();
  if (activeMode === "buyer" || activeMode === "seller") {
    headers["X-Active-Mode"] = activeMode;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      headers,
      credentials: "include",
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw err;
    }
    throw err;
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.message || data.error || `Request failed (${res.status})`;
    const apiErr = new Error(msg) as Error & { status: number; data: ApiError };
    apiErr.status = res.status;
    apiErr.data = data;
    throw apiErr;
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
  options: ApiFetchOptions = {},
): Promise<T> {
  try {
    return await apiFetch<T>(path, options);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw err;
    }
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
