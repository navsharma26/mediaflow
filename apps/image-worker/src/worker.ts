import { Worker, Job } from 'bullmq';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs-extra';
import { createStorageProvider } from '@mediaflow/storage-service';
import { processImageFile } from './processors/imageProcessor.js';

dotenv.config();

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mediaflow';

const storage = createStorageProvider();

// Connect MongoDB for job & asset state updates
mongoose.connect(mongoUri).then(() => {
  console.log('[Image Worker] Connected to MongoDB');
});

// Mongoose Job & Asset Schemas
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

console.log('🖼️  [Image Worker Microservice] Standalone BullMQ Worker listening on Redis queue: image-processing-queue');

export const imageWorker = new Worker(
  'image-processing-queue',
  async (job: Job) => {
    const { jobId, assetId, asset_id, storageKey, taskConfig, userId } = job.data;
    const targetAssetId = asset_id || assetId;

    console.log(`\n==================================================`);
    console.log(`[Image Worker] Processing Job ID: ${job.id} | Asset ID: ${targetAssetId}`);
    console.log(`==================================================`);

    const tempInputDir = path.resolve(`./temp/${job.id}-in`);
    const tempOutputDir = path.resolve(`./temp/${job.id}-out`);
    const sourceFileName = storageKey ? path.basename(storageKey) : `sample_image.jpg`;
    const localInputPath = path.join(tempInputDir, sourceFileName);

    try {
      // Step 1: Mark job and asset as 'processing', report 10% progress
      await job.updateProgress(10);
      await JobModel.findByIdAndUpdate(jobId, { status: 'processing', progress: 10, startedAt: new Date() });
      await AssetModel.findByIdAndUpdate(targetAssetId, { status: 'processing' });
      console.log(`[Progress 10%] Job & Asset status set to 'processing'`);

      // Step 2: Download original file from storage (or generate sample if fallback)
      await fs.ensureDir(tempInputDir);
      if (storageKey && (await storage.exists(storageKey))) {
        console.log(`[Storage] Downloading original file key: ${storageKey}`);
        await storage.downloadToFile(storageKey, localInputPath);
      } else {
        console.log(`[Storage] Generating mock original image buffer for asset: ${targetAssetId}`);
        // Create sample placeholder SVG/PNG image if raw file missing
        const mockSvgBuffer = Buffer.from(`
          <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#1e293b"/>
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#60a5fa" font-size="32" font-family="sans-serif">
              Original Asset Sample (${targetAssetId})
            </text>
          </svg>
        `);
        await fs.writeFile(localInputPath, mockSvgBuffer);
      }

      await job.updateProgress(30);
      await JobModel.findByIdAndUpdate(jobId, { progress: 30 });
      console.log(`[Progress 30%] Original file downloaded`);

      // Step 3: Resize image to 200x200 thumbnail & apply text watermark with Sharp
      const outputFileName = `thumbnail_${Date.now()}.png`;
      const localOutputPath = path.join(tempOutputDir, outputFileName);
      const imageConfig = {
        taskType: 'thumbnail' as const,
        width: 200,
        height: 200,
        watermarkText: taskConfig?.watermarkText || 'MediaFlow Watermark',
        format: 'png' as const,
        ...taskConfig,
      };

      console.log(`[Sharp] Resizing image to 200x200 thumbnail & applying watermark...`);
      await processImageFile(localInputPath, localOutputPath, imageConfig);

      // Report 50% & 75% progress back to BullMQ
      await job.updateProgress(50);
      await JobModel.findByIdAndUpdate(jobId, { progress: 50 });
      console.log(`[Progress 50%] Sharp 200x200 thumbnail & watermark processing finished`);

      await job.updateProgress(75);
      await JobModel.findByIdAndUpdate(jobId, { progress: 75 });
      console.log(`[Progress 75%] Uploading processed image artifact to cloud storage...`);

      // Step 4: Upload processed file to Storage Provider ('processed/' folder)
      const outputStorageKey = `processed/${userId || 'default'}/images/${outputFileName}`;
      const processedUrl = await storage.uploadFile(localOutputPath, outputStorageKey);


      // Step 5: Update MongoDB Asset status to 'processed' and set processed_url
      await AssetModel.findByIdAndUpdate(targetAssetId, {
        status: 'processed',
        processed_url: processedUrl,
      });

      // Mark Job completed and report 100% progress
      await JobModel.findByIdAndUpdate(jobId, {
        status: 'completed',
        progress: 100,
        outputStorageKey,
        outputPublicUrl: processedUrl,
        completedAt: new Date(),
      });
      await job.updateProgress(100);

      console.log(`[Progress 100%] ✅ Job ${job.id} Completed!`);
      console.log(`[Asset Updated] Asset ${targetAssetId} status set to 'processed' | URL: ${processedUrl}\n`);

      return { processed_url: processedUrl, outputStorageKey };
    } catch (error: any) {
      console.error(`❌ [Image Worker] Error processing Job ${job.id}:`, error);
      await JobModel.findByIdAndUpdate(jobId, {
        status: 'failed',
        errorMessage: error.message || 'Image processing failed',
      });
      await AssetModel.findByIdAndUpdate(targetAssetId, { status: 'failed' });
      throw error;
    } finally {
      await fs.remove(tempInputDir).catch(() => {});
      await fs.remove(tempOutputDir).catch(() => {});
    }
  },
  {
    connection: { host: redisHost, port: redisPort },
    concurrency: 5,
  }
);

imageWorker.on('completed', (job: Job) => {
  console.log(`[BullMQ Event] Job ${job.id} reported COMPLETED event`);
});

imageWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[BullMQ Event] Job ${job?.id} reported FAILED event: ${err.message}`);
});

