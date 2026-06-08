import 'jsonwebtoken';

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    userId: string;
    sub?: string;
    name?: string;
    email?: string | null;
    role?: 'buyer' | 'seller' | 'admin';
    status?: 'active' | 'blocked' | 'suspended';
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Jwt {}
}
