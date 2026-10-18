import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Alert } from '../models/Alert';

export const getUserAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { acknowledged, limit } = req.query;

    let filter: any = { userId };
    if (acknowledged !== undefined) {
      filter.acknowledged = acknowledged === 'true';
    }

    const maxLimit = Math.min(Number(limit) || 50, 200);

    const alerts = await Alert.find(filter)
      .sort({ timestamp: -1 })
      .limit(maxLimit)
      .lean();

    res.json({ alerts });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch alerts' });
  }
};

export const acknowledgeAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { alertId } = req.params;
    const userId = req.user?.userId;

    const alert = await Alert.findOne({ _id: alertId, userId });
    if (!alert) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    await alert.save();

    res.json({ message: 'Alert acknowledged', alert });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to acknowledge alert' });
  }
};
