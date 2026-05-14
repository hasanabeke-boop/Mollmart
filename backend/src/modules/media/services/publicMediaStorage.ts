import fs from 'fs';
import path from 'path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import config from '../../../config/config';

type R2Config = Extract<typeof config.r2, { enabled: true }>;

export type StoredPublicMedia = {
  key: string;
  url: string;
};

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function createClient(cfg: R2Config): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: cfg.endpoint.replace(/\/$/, ''),
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey
    },
    forcePathStyle: true
  });
}

function safeFolderPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'media';
}

function safeExtension(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  return allowedExtensions.has(ext) ? ext : '.jpg';
}

function publicUrlForKey(key: string): string {
  if (!config.r2.enabled) {
    const base = config.server.url.replace(/\/$/, '');
    return `${base}/uploads/${key}`;
  }

  const base = config.r2.publicBaseUrl.replace(/\/$/, '');
  const objectPath = key.startsWith('/') ? key : `/${key}`;
  return `${base}${objectPath}`;
}

export async function storePublicImage(
  folderParts: string[],
  file: Express.Multer.File
): Promise<StoredPublicMedia> {
  const ext = safeExtension(file.originalname);
  const filename = `${uuidv4()}${ext}`;
  const key = [...folderParts.map(safeFolderPart), filename].join('/');

  if (config.r2.enabled) {
    const client = createClient(config.r2);
    await client.send(
      new PutObjectCommand({
        Bucket: config.r2.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=31536000, immutable'
      })
    );
    return { key, url: publicUrlForKey(key) };
  }

  const uploadRoot = path.join(process.cwd(), 'uploads', ...key.split('/').slice(0, -1));
  fs.mkdirSync(uploadRoot, { recursive: true });
  fs.writeFileSync(path.join(uploadRoot, filename), file.buffer);

  return { key, url: publicUrlForKey(key) };
}
