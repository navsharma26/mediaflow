export * from './interfaces/IStorageProvider.js';
export * from './providers/LocalStorageProvider.js';
export * from './providers/S3StorageProvider.js';

import { IStorageProvider } from './interfaces/IStorageProvider.js';
import { LocalStorageProvider } from './providers/LocalStorageProvider.js';
import { S3StorageProvider } from './providers/S3StorageProvider.js';

export function createStorageProvider(): IStorageProvider {
  const driver = process.env.STORAGE_DRIVER || 'local';

  if (driver === 's3') {
    const region = process.env.AWS_REGION || 'us-east-1';
    const bucket = process.env.AWS_S3_BUCKET || 'mediaflow-bucket';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    return new S3StorageProvider(region, bucket, accessKeyId, secretAccessKey);
  }

  const localPath = process.env.LOCAL_STORAGE_PATH || './uploads';
  const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:5000';
  return new LocalStorageProvider(localPath, baseUrl);
}
