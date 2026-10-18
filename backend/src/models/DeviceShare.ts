import { Schema, model, Document, Types } from 'mongoose';

export type ShareRole = 'ADMIN' | 'VIEWER';

export interface IDeviceShare extends Document {
  deviceId: string;
  userId: Types.ObjectId;
  role: ShareRole;
  sharedBy: Types.ObjectId;
  createdAt: Date;
}

const DeviceShareSchema = new Schema<IDeviceShare>({
  deviceId: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['ADMIN', 'VIEWER'], default: 'VIEWER' },
  sharedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Ensure a user cannot be added twice for the same device
DeviceShareSchema.index({ deviceId: 1, userId: 1 }, { unique: true });

export const DeviceShare = model<IDeviceShare>('DeviceShare', DeviceShareSchema);
