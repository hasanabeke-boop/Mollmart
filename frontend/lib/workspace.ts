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

/** Buyer flows (my requests, create request) — not only DB `role`, but workspace + canBuy. */
export function canUseBuyerWorkspace(
  user: { role: string; canBuy?: boolean } | null | undefined,
  activeRole?: "buyer" | "seller" | "admin",
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.canBuy === false) return false;
  if (user.role === "buyer") return true;
  return activeRole === "buyer";
}

/** Seller flows (browse board, seller dashboard) — workspace + canSell, not only DB `role`. */
export function canUseSellerWorkspace(
  user: { role: string; canSell?: boolean } | null | undefined,
  activeRole?: "buyer" | "seller" | "admin",
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.canSell === false) return false;
  if (user.role === "seller") return true;
  return activeRole === "seller";
}

/** Profile editor: seller storefront fields (DB role may stay `buyer` in mixed mode). */
export function canEditSellerProfile(
  user: { role: string; canSell?: boolean } | null | undefined,
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.canSell !== false;
}

/** Profile editor: buyer profile fields. */
export function canEditBuyerProfile(
  user: { role: string; canBuy?: boolean } | null | undefined,
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.canBuy !== false;
}
