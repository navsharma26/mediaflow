import { Response } from 'express';
import path from 'path';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { AssetModel } from '../models/Asset.js';
import { createStorageProvider } from '@mediaflow/storage-service';
import { MediaType } from '@mediaflow/shared-types';

const storage = createStorageProvider();

export async function uploadIntent(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized user' });
    }

    const { filename, mimeType, mediaType, size } = req.body;

    if (!filename || !mimeType || !mediaType) {
      return res.status(400).json({ error: 'filename, mimeType, and mediaType are required' });
    }

    // Key structure: raw/<userId>/<mediaType>s/<timestamp>-<filename>
    const targetKey = `raw/${userId}/${mediaType}s/${Date.now()}-${filename}`;
    
    // Generate S3 Presigned URL for frontend direct PUT upload
    const presignedUploadUrl = await storage.getPresignedUploadUrl(targetKey, mimeType, 3600);
    const publicUrl = storage.getPublicUrl(targetKey);

    // Save placeholder Asset record in MongoDB
    const placeholderAsset = await AssetModel.create({
      userId,
      filename,
      original_url: publicUrl,
      status: 'pending',
      mimeType,
      mediaType,
      storageKey: targetKey,
      metadata: {
        size: size || 0,
        format: path.extname(filename).replace('.', ''),
      },
    });

    return res.status(201).json({
      message: 'Upload intent created successfully',
      assetId: placeholderAsset._id.toString(),
      uploadUrl: presignedUploadUrl, // AWS S3 Presigned URL (or local proxy signed URL)
      storageKey: targetKey,
      status: placeholderAsset.status,
      filename: placeholderAsset.filename,
    });
  } catch (error) {
    console.error('Upload intent error:', error);
    return res.status(500).json({ error: 'Failed to create upload intent' });
  }
}

export async function directUpload(req: AuthenticatedRequest, res: Response) {
  try {
    const key = req.query.key as string;
    if (!key) {
      return res.status(400).json({ error: 'Query parameter key is required' });
    }

    const fileBuffer = req.body;
    const publicUrl = await storage.uploadFile(fileBuffer, key, req.headers['content-type'] as string);

    // Update asset status to uploaded
    await AssetModel.findOneAndUpdate({ storageKey: key }, { status: 'uploaded' });

    return res.json({ status: 'success', publicUrl, key });
  } catch (error) {
    console.error('Direct upload error:', error);
    return res.status(500).json({ error: 'Direct upload failed' });
  }
}

export async function uploadAsset(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No media file provided' });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized user' });
    }

    const file = req.file;
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');

    if (!isImage && !isVideo) {
      return res.status(400).json({ error: 'Unsupported file type. Only image and video uploads are accepted.' });
    }

    const mediaType: MediaType = isImage ? 'image' : 'video';
    const targetKey = `raw/${userId}/${mediaType}s/${Date.now()}-${path.basename(file.originalname)}`;

    const publicUrl = await storage.uploadFile(file.path, targetKey, file.mimetype);

    const newAsset = await AssetModel.create({
      userId,
      filename: file.originalname,
      original_url: publicUrl,
      status: 'uploaded',
      mimeType: file.mimetype,
      mediaType,
      storageKey: targetKey,
      metadata: {
        size: file.size,
        format: path.extname(file.originalname).replace('.', ''),
      },
    });

    return res.status(201).json(newAsset);
  } catch (error) {
    console.error('Asset upload error:', error);
    return res.status(500).json({ error: 'Failed to upload asset' });
  }
}

export async function getUserAssets(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const assets = await AssetModel.find({ userId }).sort({ createdAt: -1 });
    return res.json(assets);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve assets' });
  }
}
