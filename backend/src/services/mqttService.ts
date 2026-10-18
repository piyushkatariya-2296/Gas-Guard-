import mqtt, { MqttClient } from 'mqtt';
import { config } from '../config/env';
import { Device } from '../models/Device';
import { Reading } from '../models/Reading';
import { Alert } from '../models/Alert';
import { User } from '../models/User';
import { DeviceShare } from '../models/DeviceShare';
import { sendPushNotification } from './fcmService';

let client: MqttClient | null = null;

export const initMqttClient = (): MqttClient => {
  console.log(`[MQTT] Connecting to Broker at ${config.mqtt.brokerUrl}...`);

  client = mqtt.connect(config.mqtt.brokerUrl, {
    clientId: config.mqtt.clientId,
    username: config.mqtt.username || undefined,
    password: config.mqtt.password || undefined,
    reconnectPeriod: 3000,
    connectTimeout: 10000,
  });

  client.on('connect', () => {
    console.log('[MQTT] Connected to MQTT Broker successfully');
    
    // Subscribe to all device channels
    client?.subscribe('gasguard/+/telemetry', { qos: 0 });
    client?.subscribe('gasguard/+/alert', { qos: 2 });
    client?.subscribe('gasguard/+/heartbeat', { qos: 1 });
    client?.subscribe('gasguard/+/status', { qos: 1 });
    console.log('[MQTT] Subscribed to topics: gasguard/+/telemetry, alert, heartbeat, status');
  });

  client.on('message', async (topic, payload) => {
    try {
      const topicParts = topic.split('/');
      if (topicParts.length < 3 || topicParts[0] !== 'gasguard') return;

      const deviceId = topicParts[1];
      const channel = topicParts[2];
      const data = JSON.parse(payload.toString());

      if (channel === 'telemetry') {
        await handleTelemetry(deviceId, data);
      } else if (channel === 'alert') {
        await handleEmergencyAlert(deviceId, data);
      } else if (channel === 'heartbeat') {
        await handleHeartbeat(deviceId, data);
      } else if (channel === 'status') {
        await handleStatusUpdate(deviceId, data);
      }
    } catch (err) {
      console.error(`[MQTT] Error processing topic '${topic}':`, err);
    }
  });

  let lastMqttErrorTime = 0;
  client.on('error', (err: any) => {
    const now = Date.now();
    if (now - lastMqttErrorTime > 30000) {
      console.warn(`[MQTT] Broker not reachable at ${config.mqtt.brokerUrl} (${err.code || err.message}). Will retry automatically.`);
      lastMqttErrorTime = now;
    }
  });

  client.on('reconnect', () => {
    // Silent background reconnection attempt
  });

  return client;
};

const handleTelemetry = async (deviceId: string, data: any) => {
  const gasValue = Number(data.gasValue || data.rawAdc || 0);
  const rawAdc = Number(data.rawAdc || gasValue);
  const status = data.status || (gasValue > 1500 ? 'GAS_DETECTED' : gasValue > 1000 ? 'WARNING' : 'SAFE');
  const buzzer = Boolean(data.buzzer);
  const wifiRssi = data.wifiRssi ? Number(data.wifiRssi) : undefined;
  const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();

  // Save historical reading
  await Reading.create({
    deviceId,
    gasValue,
    rawAdc,
    status,
    buzzer,
    wifiRssi,
    timestamp
  });

  // Update device record
  const device = await Device.findOne({ deviceId });
  if (device) {
    device.lastSeen = new Date();
    device.status = status;
    if (wifiRssi !== undefined) device.wifiRssi = wifiRssi;
    if (data.firmwareVersion) device.firmwareVersion = data.firmwareVersion;
    await device.save();

    // Trigger alerts if status is WARNING or GAS_DETECTED
    if (status === 'GAS_DETECTED' || status === 'WARNING') {
      await processGasAlert(device, status, gasValue);
    }
  }
};

const handleEmergencyAlert = async (deviceId: string, data: any) => {
  const device = await Device.findOne({ deviceId });
  if (!device) return;

  const gasValue = Number(data.gasValue || 0);
  const status = data.status || 'GAS_DETECTED';

  device.status = status;
  device.lastSeen = new Date();
  await device.save();

  await processGasAlert(device, status, gasValue);
};

const handleHeartbeat = async (deviceId: string, data: any) => {
  const device = await Device.findOne({ deviceId });
  if (device) {
    device.lastSeen = new Date();
    if (device.status === 'OFFLINE') {
      device.status = 'SAFE';
    }
    if (data.wifiRssi !== undefined) device.wifiRssi = data.wifiRssi;
    await device.save();
  }
};

const handleStatusUpdate = async (deviceId: string, data: any) => {
  const device = await Device.findOne({ deviceId });
  if (device && data.online === false) {
    device.status = 'OFFLINE';
    device.lastSeen = new Date();
    await device.save();
  }
};

const processGasAlert = async (device: any, status: string, gasValue: number) => {
  // Prevent duplicate alert flooding within 30 seconds
  const recentAlert = await Alert.findOne({
    deviceId: device.deviceId,
    status,
    timestamp: { $gt: new Date(Date.now() - 30000) }
  });

  if (recentAlert) return;

  const isCritical = status === 'GAS_DETECTED';
  const message = isCritical
    ? `🚨 GAS LEAK DETECTED on '${device.name}' (${device.deviceId})! Current Level: ${gasValue}`
    : `⚠️ High gas concentration warning on '${device.name}' (${device.deviceId}). Level: ${gasValue}`;

  // Find owner and all shared user accounts
  const owner = await User.findById(device.ownerId);
  const shares = await DeviceShare.find({ deviceId: device.deviceId });
  const sharedUserIds = shares.map(s => s.userId);
  const sharedUsers = await User.find({ _id: { $in: sharedUserIds } });

  const targetUsers = [owner, ...sharedUsers].filter(Boolean);

  for (const user of targetUsers) {
    if (!user) continue;

    const alert = await Alert.create({
      deviceId: device.deviceId,
      userId: user._id,
      type: isCritical ? 'GAS_LEAK' : 'WARNING_LEVEL',
      gasValue,
      status,
      message,
      timestamp: new Date()
    });

    if (user.fcmTokens && user.fcmTokens.length > 0) {
      await sendPushNotification(
        user.fcmTokens,
        isCritical ? '🚨 DANGER: GAS LEAK DETECTED!' : '⚠️ WARNING: Gas Concentration High',
        message,
        { deviceId: device.deviceId, alertId: alert._id.toString(), status }
      );
      alert.notificationSent = true;
      await alert.save();
    }
  }
};

export const publishCommand = (deviceId: string, payload: object): boolean => {
  if (!client || !client.connected) {
    console.error('[MQTT] Cannot publish command: Client disconnected');
    return false;
  }
  const topic = `gasguard/${deviceId}/command`;
  client.publish(topic, JSON.stringify(payload), { qos: 1 });
  console.log(`[MQTT] Published command to '${topic}':`, payload);
  return true;
};
