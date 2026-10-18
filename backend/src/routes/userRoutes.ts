import { Router } from 'express';
import { getMyProfile } from '../controllers/userController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

router.use(authenticateJwt);

router.get('/me', getMyProfile);

export default router;
