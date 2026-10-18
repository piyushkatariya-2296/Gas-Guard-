import mongoose from 'mongoose';
import { config } from './env';

export const connectDB = async (): Promise<typeof mongoose | null> => {
  try {
    const conn = await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error: any) {
    console.warn(`[Database] MongoDB not connected (${error.message}). Backend will run with healthcheck active; connect MongoDB or configure MONGODB_URI in .env for full persistence.`);
    return null;
  }
};
