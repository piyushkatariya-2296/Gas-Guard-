import { Schema, model, Document, Types } from 'mongoose';

export type DeviceStatus = 'SAFE' | 'WARNING' | 'GAS_DETECTED' | 'OFFLINE';

export interface IDevice extends Document {
  deviceId: string;
  name: string;
  ownerId: Types.ObjectId;
  sensorType: string;
  gasProfile: string;
  firmwareVersion: string;
  status: DeviceStatus;
  warningThreshold: number;
  criticalThreshold: number;
  lastSeen: Date;
  wifiRssi?: number;
  batteryLevel?: number;
  createdAt: Date;
}

const DeviceSchema = new Schema<IDevice>({
  deviceId: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sensorType: { type: String, default: 'MQ-6' },
  gasProfile: { type: String, default: 'LPG/Iso-butane/Propane' },
  firmwareVersion: { type: String, default: '1.0.0' },
  status: { type: String, enum: ['SAFE', 'WARNING', 'GAS_DETECTED', 'OFFLINE'], default: 'SAFE' },
  warningThreshold: { type: Number, default: 1000 },
  criticalThreshold: { type: Number, default: 1500 },
  lastSeen: { type: Date, default: Date.now },
  wifiRssi: { type: Number, default: -50 },
  batteryLevel: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

DeviceSchema.index({ ownerId: 1 });

export const Device = model<IDevice>('Device', DeviceSchema);
