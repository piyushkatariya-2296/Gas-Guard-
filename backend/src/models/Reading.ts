import { Schema, model, Document } from 'mongoose';
import { DeviceStatus } from './Device';

export interface IReading extends Document {
  deviceId: string;
  gasValue: number;
  rawAdc?: number;
  status: DeviceStatus;
  buzzer: boolean;
  wifiRssi?: number;
  timestamp: Date;
}

const ReadingSchema = new Schema<IReading>({
  deviceId: { type: String, required: true, index: true },
  gasValue: { type: Number, required: true },
  rawAdc: { type: Number },
  status: { type: String, enum: ['SAFE', 'WARNING', 'GAS_DETECTED', 'OFFLINE'], required: true },
  buzzer: { type: Boolean, default: false },
  wifiRssi: { type: Number },
  timestamp: { type: Date, default: Date.now, index: true }
});

// Index for high performance time-series queries per device
ReadingSchema.index({ deviceId: 1, timestamp: -1 });

export const Reading = model<IReading>('Reading', ReadingSchema);
