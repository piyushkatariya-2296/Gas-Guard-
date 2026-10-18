import { Router } from 'express';
import { getAdminStats, getAllDevicesAdmin } from '../controllers/adminController';
import { authenticateJwt, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateJwt);
router.use(requireAdmin);

router.get('/stats', getAdminStats);
router.get('/devices', getAllDevicesAdmin);

export default router;
