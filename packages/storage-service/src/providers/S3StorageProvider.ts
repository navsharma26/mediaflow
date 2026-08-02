import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs-extra';
import { Readable } from 'stream';
import { IStorageProvider } from '../interfaces/IStorageProvider.js';

export class S3StorageProvider implements IStorageProvider {
  private client: S3Client;
  private bucket: string;
  private region: string;

  constructor(region: string, bucket: string, accessKeyId?: string, secretAccessKey?: string) {
    this.region = region;
    this.bucket = bucket;

    const config: any = { region };
    if (accessKeyId && secretAccessKey) {
      config.credentials = { accessKeyId, secretAccessKey };
    }

    this.client = new S3Client(config);
  }

  async getPresignedUploadUrl(targetKey: string, mimeType: string = 'application/octet-stream', expiresInSec: number = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: targetKey,
      ContentType: mimeType,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSec });
  }

  async uploadFile(filePathOrBuffer: string | Buffer, targetKey: string, mimeType?: string): Promise<string> {
    let body: Buffer;
    if (typeof filePathOrBuffer === 'string') {
      body = await fs.readFile(filePathOrBuffer);
    } else {
      body = filePathOrBuffer;
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: targetKey,
      Body: body,
      ContentType: mimeType || 'application/octet-stream',
    });

    await this.client.send(command);
    return this.getPublicUrl(targetKey);
  }

  async getFileStream(targetKey: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: targetKey,
    });
    const response = await this.client.send(command);
    if (!response.Body) {
      throw new Error(`Empty stream returned from S3 for key: ${targetKey}`);
    }
    return response.Body as Readable;
  }

  async downloadToFile(targetKey: string, destinationPath: string): Promise<string> {
    const stream = await this.getFileStream(targetKey);
    await fs.ensureDir(destinationPath.substring(0, destinationPath.lastIndexOf('/')));
    const writeStream = fs.createWriteStream(destinationPath);
    
    return new Promise((resolve, reject) => {
      stream.pipe(writeStream);
      writeStream.on('finish', () => resolve(destinationPath));
      writeStream.on('error', (err) => reject(err));
    });
  }

  async deleteFile(targetKey: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: targetKey,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(targetKey: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${targetKey}`;
  }

  async exists(targetKey: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: targetKey,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}
