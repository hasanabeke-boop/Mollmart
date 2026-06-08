import type { UserRole } from '@prisma/client';

export type WorkspaceMode = 'buyer' | 'seller';

export type UserCapabilities = {
  id: string;
  role: UserRole;
  canBuy: boolean;
  canSell: boolean;
  activeWorkspaceMode?: WorkspaceMode;
};

export function hasDualWorkspace(cap: Pick<UserCapabilities, 'canBuy' | 'canSell'>): boolean {
  return cap.canBuy && cap.canSell;
}

export function parseActiveModeHeader(header: string | undefined): WorkspaceMode | null {
  const v = header?.trim().toLowerCase();
  if (v === 'buyer' || v === 'seller') return v;
  return null;
}

/** Effective role for this request (drives existing requireRoles / service checks). */
export function resolveEffectiveRole(
  user: UserCapabilities,
  requestedMode: WorkspaceMode | null
): UserRole {
  if (user.role === 'admin') {
    return 'admin';
  }

  if (user.canBuy && user.canSell) {
    const mode = requestedMode ?? user.activeWorkspaceMode ?? 'buyer';
    return mode === 'seller' ? 'seller' : 'buyer';
  }

  if (user.canSell) {
    return 'seller';
  }

  return 'buyer';
}

export function mapSignupAccountType(
  accountType: 'buyer' | 'seller' | 'both'
): { role: UserRole; canBuy: boolean; canSell: boolean } {
  if (accountType === 'seller') {
    return { role: 'seller', canBuy: false, canSell: true };
  }
  if (accountType === 'both') {
    return { role: 'buyer', canBuy: true, canSell: true };
  }
  return { role: 'buyer', canBuy: true, canSell: false };
}
