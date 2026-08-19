import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const accountId = import.meta.env.VITE_R2_ACCOUNT_ID || '';
const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID || '';
const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY || '';
const bucketName = import.meta.env.VITE_R2_BUCKET_NAME || '';
const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL || '';

export const isR2Configured = Boolean(
  accountId &&
  accessKeyId &&
  secretAccessKey &&
  bucketName &&
  !accountId.includes('your-cloudflare')
);

let s3Client: S3Client | null = null;

if (isR2Configured) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadToR2(
  key: string,
  body: Uint8Array | Blob | File,
  contentType: string
): Promise<string> {
  if (!s3Client || !bucketName) {
    throw new Error('Cloudflare R2 is not configured.');
  }

  let arrayBuffer: ArrayBuffer;
  if (body instanceof Blob || body instanceof File) {
    arrayBuffer = await body.arrayBuffer();
  } else {
    arrayBuffer = body.buffer as ArrayBuffer;
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: new Uint8Array(arrayBuffer),
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Return public URL or direct path
  if (publicUrl) {
    const cleanPublicUrl = publicUrl.replace(/\/$/, '');
    return `${cleanPublicUrl}/${key}`;
  }

  return `https://${bucketName}.r2.cloudflarestorage.com/${key}`;
}

/**
 * Delete a file from Cloudflare R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  if (!s3Client || !bucketName) return;

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}
