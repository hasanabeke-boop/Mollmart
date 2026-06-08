import 'express-serve-static-core';

export type UserRole = 'buyer' | 'seller' | 'admin';

export interface AuthUser {
  id: string;
  role: UserRole;
  canBuy?: boolean;
  canSell?: boolean;
  activeMode?: 'buyer' | 'seller';
  /** Set by workspace auth middleware when both capabilities exist */
  activeWorkspaceMode?: 'buyer' | 'seller';
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}
