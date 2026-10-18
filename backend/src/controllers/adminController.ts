import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Device } from '../models/Device';
import { Alert } from '../models/Alert';

export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDevices = await Device.countDocuments();
    
    const onlineDevices = await Device.countDocuments({ status: { $ne: 'OFFLINE' } });
    const offlineDevices = await Device.countDocuments({ status: 'OFFLINE' });
    const warningDevices = await Device.countDocuments({ status: 'WARNING' });
    const criticalDevices = await Device.countDocuments({ status: 'GAS_DETECTED' });

    const recentAlerts = await Alert.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    res.json({
      stats: {
        totalUsers,
        totalDevices,
        onlineDevices,
        offlineDevices,
        warningDevices,
        criticalDevices
      },
      recentAlerts
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch admin stats' });
  }
};

export const getAllDevicesAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query;

    let filter: any = {};
    if (search) {
      filter = {
        $or: [
          { deviceId: new RegExp(search as string, 'i') },
          { name: new RegExp(search as string, 'i') }
        ]
      };
    }

    const devices = await Device.find(filter)
      .populate('ownerId', 'name email')
      .sort({ lastSeen: -1 })
      .lean();

    res.json({ devices });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch all devices' });
  }
};
