import mongoose, { Schema, Document } from 'mongoose';
import { IJob } from '@mediaflow/shared-types';

export interface IJobDocument extends Omit<IJob, '_id'>, Document {}

const JobSchema: Schema = new Schema(
  {
    bullmq_id: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    asset_id: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    taskConfig: { type: Schema.Types.Mixed, required: true },
    outputStorageKey: { type: String },
    outputPublicUrl: { type: String },
    errorMessage: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const JobModel = mongoose.model<IJobDocument>('Job', JobSchema);
