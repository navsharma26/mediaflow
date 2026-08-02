import { Worker, Job } from 'bullmq';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs-extra';
import { createStorageProvider } from '@mediaflow/storage-service';
import { processVideoFile } from './processors/videoProcessor.js';

dotenv.config();

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mediaflow';

const storage = createStorageProvider();

// Connect MongoDB for progress/status persistence
mongoose.connect(mongoUri).then(() => {
  console.log('[Video Worker] Connected to MongoDB');
});

const JobSchema = new mongoose.Schema(
  {
    status: String,
    progress: Number,
    outputStorageKey: String,
    outputPublicUrl: String,
    errorMessage: String,
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

const AssetSchema = new mongoose.Schema(
  {
    status: String,
    processed_url: String,
  },
  { timestamps: true }
);

const JobModel = mongoose.model('Job', JobSchema);
const AssetModel = mongoose.model('Asset', AssetSchema);

console.log('🎥 [Video Worker] Microservice starting up...');

const worker = new Worker(
  'video-processing-queue',
  async (job: Job) => {
    const { jobId, assetId, storageKey, taskConfig, userId } = job.data;
    console.log(`[Video Worker] Processing Job ID: ${jobId}`);

    const tempInputDir = path.resolve(`./temp/${jobId}-in`);
    const tempOutputDir = path.resolve(`./temp/${jobId}-out`);
    const sourceFileName = path.basename(storageKey);
    const localInputPath = path.join(tempInputDir, sourceFileName);

    try {
      // Step 1: Update status to processing
      await JobModel.findByIdAndUpdate(jobId, {
        status: 'processing',
        progress: 5,
        startedAt: new Date(),
      });
      await AssetModel.findByIdAndUpdate(assetId, { status: 'processing' });
      await job.updateProgress(5);

      // Step 2: Download raw file from Storage Provider
      await storage.downloadToFile(storageKey, localInputPath);
      await job.updateProgress(20);
      await JobModel.findByIdAndUpdate(jobId, { progress: 20 });

      // Step 3: Run FFmpeg transcoding / thumbnail extraction
      const isThumbnail = taskConfig.taskType === 'extract_thumbnail';
      const outputExt = isThumbnail ? 'jpg' : taskConfig.targetFormat || 'mp4';
      const outputFileName = `processed_${Date.now()}.${outputExt}`;
      const localOutputPath = path.join(tempOutputDir, outputFileName);

      await processVideoFile(localInputPath, localOutputPath, taskConfig, async (percent) => {
        const adjustedProgress = 20 + Math.round((percent / 100) * 60);
        await job.updateProgress(adjustedProgress);
        await JobModel.findByIdAndUpdate(jobId, { progress: adjustedProgress });
      });

      await job.updateProgress(85);
      await JobModel.findByIdAndUpdate(jobId, { progress: 85 });

      // Step 4: Upload processed video/thumbnail back to Storage Provider ('processed/' folder)
      const outputStorageKey = `processed/${userId || 'default'}/videos/${outputFileName}`;
      const outputPublicUrl = await storage.uploadFile(localOutputPath, outputStorageKey);


      // Step 5: Mark Job and Asset completed
      await JobModel.findByIdAndUpdate(jobId, {
        status: 'completed',
        progress: 100,
        outputStorageKey,
        outputPublicUrl,
        completedAt: new Date(),
      });
      await AssetModel.findByIdAndUpdate(assetId, {
        status: 'completed',
        processed_url: outputPublicUrl,
      });
      await job.updateProgress(100);

      console.log(`✅ [Video Worker] Job ${jobId} completed successfully! URL: ${outputPublicUrl}`);
      return { outputPublicUrl, outputStorageKey };
    } catch (error: any) {
      console.error(`❌ [Video Worker] Error processing Job ${jobId}:`, error);
      await JobModel.findByIdAndUpdate(jobId, {
        status: 'failed',
        errorMessage: error.message || 'Video processing failed',
      });
      await AssetModel.findByIdAndUpdate(assetId, { status: 'failed' });
      throw error;
    } finally {
      await fs.remove(tempInputDir).catch(() => {});
      await fs.remove(tempOutputDir).catch(() => {});
    }
  },
  {
    connection: { host: redisHost, port: redisPort },
    concurrency: 2,
  }
);

worker.on('failed', (job, err) => {
  console.error(`[Video Worker] Job ${job?.id} failed with error: ${err.message}`);
});
