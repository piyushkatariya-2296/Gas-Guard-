import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Device } from '../models/Device';
import { DeviceShare } from '../models/DeviceShare';
import { User } from '../models/User';
import { publishCommand } from '../services/mqttService';
import { Types } from 'mongoose';

export const getMyDevices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    // Devices owned by user
    const ownedDevices = await Device.find({ ownerId: userId }).lean();

    // Devices shared with user
    const shares = await DeviceShare.find({ userId }).lean();
    const sharedDeviceIds = shares.map((s) => s.deviceId);
    const sharedDevices = await Device.find({ deviceId: { $in: sharedDeviceIds } }).lean();

    const formattedOwned = ownedDevices.map((d) => ({ ...d, userRole: 'OWNER' }));
    const formattedShared = sharedDevices.map((d) => {
      const shareInfo = shares.find((s) => s.deviceId === d.deviceId);
      return { ...d, userRole: shareInfo?.role || 'VIEWER' };
    });

    res.json({
      devices: [...formattedOwned, ...formattedShared]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch devices' });
  }
};

export const createDevice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { deviceId, name, sensorType, warningThreshold, criticalThreshold } = req.body;

    if (!deviceId || !name) {
      res.status(400).json({ error: 'Device ID and Name are required' });
      return;
    }

    const formattedDeviceId = deviceId.toUpperCase().trim();

    const existing = await Device.findOne({ deviceId: formattedDeviceId });
    if (existing) {
      res.status(400).json({ error: `Device '${formattedDeviceId}' is already registered` });
      return;
    }

    const device = await Device.create({
      deviceId: formattedDeviceId,
      name,
      ownerId: userId,
      sensorType: sensorType || 'MQ-6',
      warningThreshold: warningThreshold || 1000,
      criticalThreshold: criticalThreshold || 1500,
      status: 'SAFE',
      lastSeen: new Date()
    });

    res.status(201).json({
      message: 'Device claimed and registered successfully',
      device
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to register device' });
  }
};

export const getDeviceDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deviceId } = req.params;
    const userId = req.user?.userId;

    const device = await Device.findOne({ deviceId: deviceId.toUpperCase() });
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    // Verify ownership or sharing access
    const isOwner = device.ownerId.toString() === userId;
    const share = await DeviceShare.findOne({ deviceId: device.deviceId, userId });

    if (!isOwner && !share && req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Access denied to this device' });
      return;
    }

    const userRole = isOwner ? 'OWNER' : share?.role || 'VIEWER';

    res.json({
      device: {
        ...device.toObject(),
        userRole
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch device details' });
  }
};

export const updateDevice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deviceId } = req.params;
    const userId = req.user?.userId;
    const { name, warningThreshold, criticalThreshold } = req.body;

    const device = await Device.findOne({ deviceId: deviceId.toUpperCase() });
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    const isOwner = device.ownerId.toString() === userId;
    const share = await DeviceShare.findOne({ deviceId: device.deviceId, userId, role: 'ADMIN' });

    if (!isOwner && !share && req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Insufficient permissions to update this device' });
      return;
    }

    if (name) device.name = name;
    if (warningThreshold !== undefined) device.warningThreshold = Number(warningThreshold);
    if (criticalThreshold !== undefined) device.criticalThreshold = Number(criticalThreshold);

    await device.save();

    // Publish threshold update command over MQTT to ESP32 firmware
    if (warningThreshold !== undefined || criticalThreshold !== undefined) {
      publishCommand(device.deviceId, {
        command: 'SET_THRESHOLD',
        warningThreshold: device.warningThreshold,
        criticalThreshold: device.criticalThreshold
      });
    }

    res.json({ message: 'Device updated successfully', device });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update device' });
  }
};

export const deleteDevice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deviceId } = req.params;
    const userId = req.user?.userId;

    const device = await Device.findOne({ deviceId: deviceId.toUpperCase() });
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    if (device.ownerId.toString() !== userId && req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only the device owner can delete this device' });
      return;
    }

    await Device.deleteOne({ deviceId: device.deviceId });
    await DeviceShare.deleteMany({ deviceId: device.deviceId });

    res.json({ message: 'Device deleted and unlinked successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete device' });
  }
};

export const shareDevice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deviceId } = req.params;
    const userId = req.user?.userId;
    const { email, role } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email of user to share with is required' });
      return;
    }

    const device = await Device.findOne({ deviceId: deviceId.toUpperCase() });
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    if (device.ownerId.toString() !== userId && req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only device owner can share this device' });
      return;
    }

    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (!targetUser) {
      res.status(404).json({ error: `User with email '${email}' not found` });
      return;
    }

    if (targetUser._id.toString() === userId) {
      res.status(400).json({ error: 'You are already the owner of this device' });
      return;
    }

    const shareRole = role === 'ADMIN' ? 'ADMIN' : 'VIEWER';

    const share = await DeviceShare.findOneAndUpdate(
      { deviceId: device.deviceId, userId: targetUser._id },
      { role: shareRole, sharedBy: new Types.ObjectId(userId) },
      { upsert: true, new: true }
    );

    res.json({ message: `Device shared with ${email} as ${shareRole}`, share });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to share device' });
  }
};

export const revokeShare = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deviceId, targetUserId } = req.params;
    const userId = req.user?.userId;

    const device = await Device.findOne({ deviceId: deviceId.toUpperCase() });
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    if (device.ownerId.toString() !== userId && req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only device owner can revoke shared access' });
      return;
    }

    await DeviceShare.deleteOne({ deviceId: device.deviceId, userId: targetUserId });
    res.json({ message: 'Shared access revoked successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to revoke shared access' });
  }
};
