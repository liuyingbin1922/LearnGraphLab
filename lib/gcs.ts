import { Storage } from '@google-cloud/storage';
import { nanoid } from 'nanoid';

function getServiceAccount() {
  const raw = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('Missing env GCP_SERVICE_ACCOUNT_JSON');
  return JSON.parse(raw);
}

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: getServiceAccount(),
});

export function getBucket() {
  const bucketName = process.env.GCS_BUCKET;
  if (!bucketName) throw new Error('Missing env GCS_BUCKET');
  return storage.bucket(bucketName);
}

export function makeGsUri(objectPath: string) {
  return `gs://${process.env.GCS_BUCKET}/${objectPath}`;
}

export function makePublicHttpUrl(objectPath: string) {
  return `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${objectPath}`;
}

export async function uploadImageToGCS(file: File, userId = 'anon') {
  const bucket = getBucket();
  const ab = await file.arrayBuffer();
  const buf = Buffer.from(ab);

  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const objectPath = `uploads/${userId}/${Date.now()}-${nanoid(10)}.${ext}`;
  const gcsFile = bucket.file(objectPath);

  await gcsFile.save(buf, {
    contentType: file.type || 'application/octet-stream',
    resumable: false,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });

  return {
    objectPath,
    gsUri: makeGsUri(objectPath),
    httpUrl: makePublicHttpUrl(objectPath),
    mimeType: file.type || 'application/octet-stream',
  };
}

/**
 * 生产推荐：Signed URL（不需要公开 bucket）
 */
export async function getSignedReadUrl(objectPath: string, expiresInMinutes = 60) {
  const bucket = getBucket();
  const file = bucket.file(objectPath);

  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });
  return url;
}
