import 'express-serve-static-core';

export type UserRole = 'buyer' | 'seller' | 'admin';

export interface AuthUser {
  id: string;
  role: UserRole;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}
