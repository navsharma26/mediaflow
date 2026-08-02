import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { AssetModel } from '../models/Asset.js';
import { JobModel } from '../models/Job.js';
import { imageQueue, videoQueue } from '../queues/jobQueues.js';

export async function createJob(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { assetId, taskConfig } = req.body;

    if (!assetId || !taskConfig || !taskConfig.taskType) {
      return res.status(400).json({ error: 'assetId and valid taskConfig with taskType are required' });
    }

    const asset = await AssetModel.findOne({ _id: assetId, userId });
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found or access denied' });
    }

    // Create Job record in MongoDB
    const job = await JobModel.create({
      userId,
      asset_id: asset._id,
      type: asset.mediaType,
      status: 'pending',
      progress: 0,
      taskConfig,
    });

    const payload = {
      jobId: job._id.toString(),
      assetId: asset._id.toString(),
      userId,
      storageKey: asset.storageKey,
      mimeType: asset.mimeType,
      taskConfig,
    };

    let bullJob;
    // Dispatch to appropriate BullMQ queue
    if (asset.mediaType === 'image') {
      bullJob = await imageQueue.add('process-image', payload);
      console.log(`[BullMQ] Enqueued image job ${job._id} (BullMQ ID: ${bullJob.id})`);
    } else {
      bullJob = await videoQueue.add('process-video', payload);
      console.log(`[BullMQ] Enqueued video job ${job._id} (BullMQ ID: ${bullJob.id})`);
    }

    // Update job with BullMQ job ID
    if (bullJob && bullJob.id) {
      job.bullmq_id = bullJob.id;
      await job.save();
    }

    return res.status(202).json(job);
  } catch (error) {
    console.error('Job creation error:', error);
    return res.status(500).json({ error: 'Failed to create and queue job' });
  }
}

export async function getJobs(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const jobs = await JobModel.find({ userId }).sort({ createdAt: -1 }).populate('asset_id');
    return res.json(jobs);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
}

export async function getJobById(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const job = await JobModel.findOne({ _id: id, userId }).populate('asset_id');
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    return res.json(job);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch job details' });
  }
}
