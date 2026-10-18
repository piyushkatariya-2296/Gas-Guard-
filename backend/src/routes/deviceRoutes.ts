import { Router } from 'express';
import {
  getMyDevices,
  createDevice,
  getDeviceDetails,
  updateDevice,
  deleteDevice,
  shareDevice,
  revokeShare
} from '../controllers/deviceController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

router.use(authenticateJwt);

router.get('/', getMyDevices);
router.post('/', createDevice);
router.get('/:deviceId', getDeviceDetails);
router.put('/:deviceId', updateDevice);
router.delete('/:deviceId', deleteDevice);

router.post('/:deviceId/share', shareDevice);
router.delete('/:deviceId/share/:targetUserId', revokeShare);

export default router;
