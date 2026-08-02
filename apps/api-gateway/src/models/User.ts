import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '@mediaflow/shared-types';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  passwordHash: string;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);
