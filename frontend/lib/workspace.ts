export type WorkspaceMode = "buyer" | "seller";

const STORAGE_KEY = "mollmart_active_mode";

export function readStoredActiveMode(): WorkspaceMode | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    if (v === "buyer" || v === "seller") return v;
  } catch {
    // ignore
  }
  return null;
}

export function writeStoredActiveMode(mode: WorkspaceMode): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

export function defaultActiveMode(canBuy: boolean, canSell: boolean): WorkspaceMode {
  if (canSell && !canBuy) return "seller";
  return "buyer";
}

export function resolveActiveRole(
  storedRole: "buyer" | "seller" | "admin",
  canBuy: boolean,
  canSell: boolean,
  mode: WorkspaceMode,
): "buyer" | "seller" | "admin" {
  if (storedRole === "admin") return "admin";
  if (canBuy && canSell) return mode;
  if (canSell) return "seller";
  return "buyer";
}
