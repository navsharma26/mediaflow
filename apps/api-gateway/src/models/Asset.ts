import mongoose, { Schema, Document } from 'mongoose';
import { IAsset } from '@mediaflow/shared-types';

export interface IAssetDocument extends Omit<IAsset, '_id'>, Document {}

const AssetSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    original_url: { type: String, required: true },
    processed_url: { type: String },
    status: {
      type: String,
      enum: ['pending', 'uploaded', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    mimeType: { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    storageKey: { type: String, required: true },
    metadata: {
      width: { type: Number },
      height: { type: Number },
      duration: { type: Number },
      bitrate: { type: Number },
      format: { type: String },
      size: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const AssetModel = mongoose.model<IAssetDocument>('Asset', AssetSchema);
