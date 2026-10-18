import { Router } from 'express';
import { getDeviceReadings, getLatestReading } from '../controllers/readingController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

router.use(authenticateJwt);

router.get('/:deviceId/readings', getDeviceReadings);
router.get('/:deviceId/latest', getLatestReading);

export default router;
