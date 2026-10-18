import { Router } from 'express';
import { register, login, updateFcmToken } from '../controllers/authController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/fcm-token', authenticateJwt, updateFcmToken);

export default router;
