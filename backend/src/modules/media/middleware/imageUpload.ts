import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
    if (!ok) {
      cb(new Error('Only JPEG, PNG, WebP or GIF images are allowed'));
      return;
    }
    cb(null, true);
  }
});

export function imageUploadSingle(req: Request, res: Response, next: NextFunction): void {
  imageUpload.single('file')(req, res, (err: unknown) => {
    if (err != null) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      res.status(400).json({ message: msg });
      return;
    }
    next();
  });
}
