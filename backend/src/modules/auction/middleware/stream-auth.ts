import { verify } from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import config from '../../../config/config';
import prisma from '../../../config/prisma';
import {
  parseActiveModeHeader,
  resolveEffectiveRole
} from '../../../shared/workspaceAuth';

interface TokenPayload {
  sub?: string;
  userId?: string;
}

/** SSE clients pass ?access_token= because EventSource cannot set Authorization. */
export async function authenticateAuctionStream(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const queryToken =
      typeof req.query.access_token === 'string' ? req.query.access_token.trim() : '';
    const header = req.header('authorization');
    const token =
      header != null && header.startsWith('Bearer ')
        ? header.slice('Bearer '.length)
        : queryToken;

    if (token.length === 0) {
      res.status(httpStatus.UNAUTHORIZED).json({ message: 'Authentication required' });
      return;
    }

    const payload = verify(token, config.jwt.accessSecret) as TokenPayload;
    const userId = payload.sub ?? payload.userId;
    if (userId == null) {
      res.status(httpStatus.UNAUTHORIZED).json({ message: 'Invalid token payload' });
      return;
    }

    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        canBuy: true,
        canSell: true,
        activeWorkspaceMode: true,
        status: true
      }
    });

    if (row == null || row.status === 'blocked' || row.status === 'suspended') {
      res.status(httpStatus.UNAUTHORIZED).json({ message: 'User not found or inactive' });
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
