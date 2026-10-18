import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Reading } from '../models/Reading';
import { Device } from '../models/Device';

export const getDeviceReadings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deviceId } = req.params;
    const { range, startDate, endDate, limit } = req.query;

    const device = await Device.findOne({ deviceId: deviceId.toUpperCase() });
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    let filter: any = { deviceId: device.deviceId };

    const now = new Date();
    if (range === 'today' || range === '1d') {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      filter.timestamp = { $gte: oneDayAgo };
    } else if (range === '7d') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filter.timestamp = { $gte: sevenDaysAgo };
    } else if (range === '30d') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filter.timestamp = { $gte: thirtyDaysAgo };
    } else if (startDate && endDate) {
      filter.timestamp = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }

    const maxLimit = Math.min(Number(limit) || 200, 1000);

    const readings = await Reading.find(filter)
      .sort({ timestamp: -1 })
      .limit(maxLimit)
      .lean();

    res.json({
      deviceId: device.deviceId,
      count: readings.length,
      readings: readings.reverse() // Return chronologically for chart rendering
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch historical readings' });
  }
};

export const getLatestReading = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deviceId } = req.params;

    const latest = await Reading.findOne({ deviceId: deviceId.toUpperCase() })
      .sort({ timestamp: -1 })
      .lean();

    if (!latest) {
      res.status(404).json({ error: 'No telemetry readings found for this device' });
      return;
    }

    res.json({ reading: latest });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch latest reading' });
  }
};
