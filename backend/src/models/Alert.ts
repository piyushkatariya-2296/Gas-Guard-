import { Schema, model, Document, Types } from 'mongoose';
import { DeviceStatus } from './Device';

export type AlertType = 'GAS_LEAK' | 'WARNING_LEVEL' | 'DEVICE_OFFLINE' | 'LOW_BATTERY';

export interface IAlert extends Document {
  deviceId: string;
  userId: Types.ObjectId;
  type: AlertType;
  gasValue?: number;
  status: DeviceStatus;
  message: string;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  notificationSent: boolean;
  timestamp: Date;
}

const AlertSchema = new Schema<IAlert>({
  deviceId: { type: String, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['GAS_LEAK', 'WARNING_LEVEL', 'DEVICE_OFFLINE', 'LOW_BATTERY'], required: true },
  gasValue: { type: Number },
  status: { type: String, enum: ['SAFE', 'WARNING', 'GAS_DETECTED', 'OFFLINE'], required: true },
  message: { type: String, required: true },
  acknowledged: { type: Boolean, default: false },
  acknowledgedAt: { type: Date },
  notificationSent: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now, index: true }
});

AlertSchema.index({ userId: 1, acknowledged: 1, timestamp: -1 });

export const Alert = model<IAlert>('Alert', AlertSchema);
