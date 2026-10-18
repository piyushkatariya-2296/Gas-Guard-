import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import deviceRoutes from './routes/deviceRoutes';
import readingRoutes from './routes/readingRoutes';
import alertRoutes from './routes/alertRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import { errorHandler } from './middleware/errorHandler';

export const createApp = (): Application => {
  const app: Application = express();

  // Security & Utility Middleware
  app.use(helmet());
  app.use(cors({ origin: '*' }));
  app.use(express.json());
  app.use(morgan('dev'));

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests from this IP, please try again later.' }
  });
  app.use('/api/', limiter);

  // Healthcheck Endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'UP',
      system: 'GasGuard Backend API Service',
      timestamp: new Date().toISOString()
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/devices', deviceRoutes);
  app.use('/api/devices', readingRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
