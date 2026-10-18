import mongoose from 'mongoose';
import { Device } from '../models/Device';
import { Alert } from '../models/Alert';
import { sendPushNotification } from './fcmService';
import { User } from '../models/User';

const OFFLINE_THRESHOLD_MS = 60 * 1000; // 60 seconds threshold

export const startHeartbeatMonitor = (intervalMs = 30000): NodeJS.Timeout => {
  console.log('[Heartbeat Monitor] Periodic device liveness check initialized (Interval: 30s)');

  return setInterval(async () => {
    try {
      if (mongoose.connection.readyState !== 1) return;
      const offlineCutoff = new Date(Date.now() - OFFLINE_THRESHOLD_MS);

      // Find active devices whose lastSeen is older than 60s
      const staleDevices = await Device.find({
        status: { $ne: 'OFFLINE' },
        lastSeen: { $lt: offlineCutoff }
      });

      for (const device of staleDevices) {
        console.warn(`[Heartbeat Monitor] Device ${device.deviceId} (${device.name}) missed heartbeat. Marking OFFLINE.`);

        device.status = 'OFFLINE';
        await device.save();

        // Create offline alert
        const alert = await Alert.create({
          deviceId: device.deviceId,
          userId: device.ownerId,
          type: 'DEVICE_OFFLINE',
          status: 'OFFLINE',
          message: `Device '${device.name}' (${device.deviceId}) is offline. Last seen: ${device.lastSeen.toLocaleTimeString()}`,
          timestamp: new Date()
        });

        // Notify device owner
        const owner = await User.findById(device.ownerId);
        if (owner && owner.fcmTokens && owner.fcmTokens.length > 0) {
          await sendPushNotification(
            owner.fcmTokens,
            `⚠️ DEVICE OFFLINE`,
            `Device '${device.name}' (${device.deviceId}) has disconnected from GasGuard Cloud.`,
            { deviceId: device.deviceId, alertId: alert._id.toString() }
          );
        }
      }
    } catch (error) {
      console.error('[Heartbeat Monitor] Error during liveness audit:', error);
    }
  }, intervalMs);
};
