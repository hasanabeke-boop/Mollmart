import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';
import httpStatus from 'http-status';
import config from '../config/config';
import prisma from '../config/prisma';
import {
  parseActiveModeHeader,
  resolveEffectiveRole,
  type WorkspaceMode
} from './workspaceAuth';

export type WorkspaceAuthUser = {
  id: string;
  role: 'buyer' | 'seller' | 'admin';
  canBuy: boolean;
  canSell: boolean;
  activeMode: WorkspaceMode;
};

interface TokenPayload {
  sub?: string;
  userId?: string;
  role?: 'buyer' | 'seller' | 'admin';
}

async function resolveDevUser(req: Request): Promise<WorkspaceAuthUser | null> {
  const idHeader = req.header('x-user-id');
  const roleHeader = req.header('x-user-role');
  if (idHeader == null || roleHeader == null) {
    return null;
  }
  if (!['buyer', 'seller', 'admin'].includes(roleHeader)) {
    return null;
  }

  const row = await prisma.user.findUnique({
    where: { id: idHeader },
    select: { id: true, role: true, canBuy: true, canSell: true, activeWorkspaceMode: true, status: true }
  });

  if (row == null || row.status !== 'active') {
    return null;
  }

  const requested = parseActiveModeHeader(req.header('x-active-mode'));
  const effectiveRole = resolveEffectiveRole(row, requested);

  return {
    id: row.id,
    role: effectiveRole,
    canBuy: row.canBuy,
    canSell: row.canSell,
    activeMode: effectiveRole === 'seller' ? 'seller' : 'buyer'
  };
}

/** For public routes: attach user when token/dev headers are valid; otherwise continue as guest. */
async function resolveOptionalUser(req: Request): Promise<WorkspaceAuthUser | null> {
  if (config.nodeEnv !== 'production') {
    const devUser = await resolveDevUser(req);
    if (devUser != null) {
      return devUser;
    }
  }

  const header = req.header('authorization');
  if (header == null || !header.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = header.slice('Bearer '.length);
    const payload = verify(token, config.jwt.accessSecret) as TokenPayload;
    const userId = payload.sub ?? payload.userId;

    if (userId == null) {
      return null;
    }

    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, canBuy: true, canSell: true, activeWorkspaceMode: true, status: true }
    });

    if (row == null || row.status === 'blocked' || row.status === 'suspended') {
      return null;
    }

    const requested = parseActiveModeHeader(req.header('x-active-mode'));
    const effectiveRole = resolveEffectiveRole(row, requested);

    return {
      id: userId,
      role: effectiveRole,
      canBuy: row.canBuy,
      canSell: row.canSell,
      activeMode: effectiveRole === 'seller' ? 'seller' : 'buyer'
    };
  } catch {
    return null;
  }
}

/** Sets req.user when a valid token is present; continues as guest otherwise. */
export async function optionalAuthenticateWorkspace(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await resolveOptionalUser(req);
    if (user != null) {
      req.user = {
        id: user.id,
        role: user.role,
        canBuy: user.canBuy,
        canSell: user.canSell,
        activeMode: user.activeMode,
      };
    }
    next();
  } catch {
    next();
  }
}

export async function authenticateWorkspace(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (config.nodeEnv !== 'production') {
      const devUser = await resolveDevUser(req);
      if (devUser != null) {
        req.user = devUser;
        next();
        return;
      }
    }

    const header = req.header('authorization');
    if (header == null || !header.startsWith('Bearer ')) {
      res.status(httpStatus.UNAUTHORIZED).json({ message: 'Authentication required' });
      return;
    }

    const token = header.slice('Bearer '.length);
    const payload = verify(token, config.jwt.accessSecret) as TokenPayload;
    const userId = payload.sub ?? payload.userId;

    if (userId == null) {
      res.status(httpStatus.UNAUTHORIZED).json({ message: 'Invalid token payload' });
      return;
    }

    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, canBuy: true, canSell: true, activeWorkspaceMode: true, status: true }
    });

    if (row == null) {
      res.status(httpStatus.UNAUTHORIZED).json({ message: 'User not found' });
      return;
    }

    if (row.status === 'blocked') {
      res.status(httpStatus.FORBIDDEN).json({ message: 'Your account is blocked' });
      return;
    }

    if (row.status === 'suspended') {
      res.status(httpStatus.FORBIDDEN).json({ message: 'Your account is suspended' });
      return;
    }

    const requested = parseActiveModeHeader(req.header('x-active-mode'));
    const effectiveRole = resolveEffectiveRole(row, requested);

    req.user = {
      id: userId,
      role: effectiveRole,
      canBuy: row.canBuy,
      canSell: row.canSell,
      activeMode: effectiveRole === 'seller' ? 'seller' : 'buyer'
    };

    next();
  } catch {
    res.status(httpStatus.UNAUTHORIZED).json({ message: 'Invalid or expired token' });
  }
}

export function requireRoles(...roles: Array<'buyer' | 'seller' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as WorkspaceAuthUser | undefined;
    if (user == null) {
      res.status(httpStatus.UNAUTHORIZED).json({ message: 'Authentication required' });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(httpStatus.FORBIDDEN).json({ message: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
