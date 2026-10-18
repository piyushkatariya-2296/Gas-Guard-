import { createApp } from './app';
import { config } from './config/env';
import { connectDB } from './config/db';
import { initMqttClient } from './services/mqttService';
import { startHeartbeatMonitor } from './services/heartbeatMonitor';

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Initialize MQTT Service Client
    initMqttClient();

    // 3. Start Heartbeat Monitor for Offline Device Detection
    startHeartbeatMonitor(30000);

    // 4. Start HTTP Server
    const app = createApp();
    app.listen(config.port, () => {
      console.log(`[Server] GasGuard Backend API running on port ${config.port} (${config.env} mode)`);
      console.log(`[Server] Healthcheck: http://localhost:${config.port}/api/health`);
    });
  } catch (error) {
    console.error('[Server] Fatal startup error:', error);
    process.exit(1);
  }
};

startServer();
