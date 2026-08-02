export type MediaType = 'image' | 'video';
export type AssetStatus = 'pending' | 'uploaded' | 'processing' | 'processed' | 'completed' | 'failed';


export interface IAssetMetadata {
  width?: number;
  height?: number;
  duration?: number;
  bitrate?: number;
  format?: string;
  size: number;
}

export interface IAsset {
  _id: string;
  userId: string;
  filename: string;
  original_url: string;
  processed_url?: string;
  status: AssetStatus;
  mimeType: string;
  mediaType: MediaType;
  storageKey: string;
  metadata: IAssetMetadata;
  createdAt: Date;
  updatedAt: Date;
}

