import fs from 'fs-extra';
import path from 'path';
import { Readable } from 'stream';
import { IStorageProvider } from '../interfaces/IStorageProvider.js';

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;
  private publicBaseUrl: string;

  constructor(baseDir: string = './uploads', publicBaseUrl: string = 'http://localhost:5001') {

    this.baseDir = path.resolve(baseDir);
    this.publicBaseUrl = publicBaseUrl;
    fs.ensureDirSync(this.baseDir);
  }

  async getPresignedUploadUrl(targetKey: string, mimeType?: string, expiresInSec?: number): Promise<string> {
    const normalizedKey = targetKey.replace(/\\/g, '/');
    return `${this.publicBaseUrl}/api/assets/direct-upload?key=${encodeURIComponent(normalizedKey)}`;
  }

  async uploadFile(filePathOrBuffer: string | Buffer, targetKey: string): Promise<string> {
    const fullPath = path.join(this.baseDir, targetKey);
    await fs.ensureDir(path.dirname(fullPath));

    if (typeof filePathOrBuffer === 'string') {
      await fs.copy(filePathOrBuffer, fullPath, { overwrite: true });
    } else {
      await fs.writeFile(fullPath, filePathOrBuffer);
    }

    return this.getPublicUrl(targetKey);
  }

  async getFileStream(targetKey: string): Promise<Readable> {
    const fullPath = path.join(this.baseDir, targetKey);
    if (!(await fs.pathExists(fullPath))) {
      throw new Error(`File not found at target key: ${targetKey}`);
    }
    return fs.createReadStream(fullPath);
  }

  async downloadToFile(targetKey: string, destinationPath: string): Promise<string> {
    const fullPath = path.join(this.baseDir, targetKey);
    if (!(await fs.pathExists(fullPath))) {
      throw new Error(`File not found at target key: ${targetKey}`);
    }
    await fs.ensureDir(path.dirname(destinationPath));
    await fs.copy(fullPath, destinationPath, { overwrite: true });
    return destinationPath;
  }

  async deleteFile(targetKey: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, targetKey);
    if (await fs.pathExists(fullPath)) {
      await fs.remove(fullPath);
      return true;
    }
    return false;
  }

  getPublicUrl(targetKey: string): string {
    const normalizedKey = targetKey.replace(/\\/g, '/');
    return `${this.publicBaseUrl}/uploads/${normalizedKey}`;
  }

  async exists(targetKey: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, targetKey);
    return fs.pathExists(fullPath);
  }
}
