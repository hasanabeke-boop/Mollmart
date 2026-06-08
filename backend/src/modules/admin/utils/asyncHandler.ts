import { NextFunction, Request, RequestHandler, Response } from 'express';

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    void handler(req, res, next).catch(next);
  };

export default asyncHandler;
