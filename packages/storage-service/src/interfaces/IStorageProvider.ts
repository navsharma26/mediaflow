import { Readable } from 'stream';

export interface IStorageProvider {
  getPresignedUploadUrl(targetKey: string, mimeType?: string, expiresInSec?: number): Promise<string>;
  uploadFile(filePathOrBuffer: string | Buffer, targetKey: string, mimeType?: string): Promise<string>;
  getFileStream(targetKey: string): Promise<Readable>;
  downloadToFile(targetKey: string, destinationPath: string): Promise<string>;
  deleteFile(targetKey: string): Promise<boolean>;
  getPublicUrl(targetKey: string): string;
  exists(targetKey: string): Promise<boolean>;
}
