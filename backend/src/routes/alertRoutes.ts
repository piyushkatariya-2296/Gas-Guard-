import { Router } from 'express';
import { getUserAlerts, acknowledgeAlert } from '../controllers/alertController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

router.use(authenticateJwt);

router.get('/', getUserAlerts);
router.post('/:alertId/ack', acknowledgeAlert);

export default router;
