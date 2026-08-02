import { MediaType } from './asset.types.js';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ImageTaskType = 'resize' | 'convert' | 'thumbnail' | 'watermark';
export type VideoTaskType = 'transcode' | 'extract_thumbnail' | 'scale_resolution' | 'hls_stream';

export interface ImageTaskConfig {
  taskType: ImageTaskType;
  width?: number;
  height?: number;
  format?: 'png' | 'jpeg' | 'webp' | 'avif';
  quality?: number;
  watermarkText?: string;
}

export interface VideoTaskConfig {
  taskType: VideoTaskType;
  targetResolution?: '1080p' | '720p' | '480p' | '360p';
  targetFormat?: 'mp4' | 'mkv' | 'webm';
  thumbnailTimestampSec?: number;
  bitrateKbps?: number;
}

export type JobTaskConfig = ImageTaskConfig | VideoTaskConfig;

export interface IJob {
  _id: string;
  bullmq_id?: string;
  userId: string;
  asset_id: string;
  type: MediaType;
  status: JobStatus;
  progress: number;
  taskConfig: JobTaskConfig;
  outputStorageKey?: string;
  outputPublicUrl?: string;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

