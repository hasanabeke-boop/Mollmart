import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export type R2CatalogConfig = {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
};

function createClient(cfg: R2CatalogConfig): S3Client {
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

export async function putCatalogImageObject(
  cfg: R2CatalogConfig,
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const client = createClient(cfg);
  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: body,
      ContentType: contentType
    })
  );
}

export function publicUrlForCatalogKey(cfg: R2CatalogConfig, key: string): string {
  const base = cfg.publicBaseUrl.replace(/\/$/, '');
  const path = key.startsWith('/') ? key : `/${key}`;
  return `${base}${path}`;
}
