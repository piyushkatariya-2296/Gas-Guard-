import admin from 'firebase-admin';
import { config } from '../config/env';

let isFcmInitialized = false;

try {
  if (
    config.firebase.projectId &&
    config.firebase.clientEmail &&
    config.firebase.privateKey &&
    !config.firebase.privateKey.includes('YOUR_KEY_HERE')
  ) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
    });
    isFcmInitialized = true;
    console.log('[FCM] Firebase Admin SDK initialized successfully');
  } else {
    console.log('[FCM] Push notifications running in demo/mock mode (configure real Firebase credentials in .env to enable FCM)');
  }
} catch (error) {
  console.error('[FCM] Failed to initialize Firebase Admin SDK:', error);
}

export const sendPushNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> => {
  if (!tokens || tokens.length === 0) {
    return false;
  }

  console.log(`[FCM Notification Triggered] To ${tokens.length} devices | ${title} - ${body}`);

  if (!isFcmInitialized) {
    console.log('[FCM Mock] Push notification logged locally (FCM credentials not configured)');
    return true;
  }

  try {
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'gasguard_emergency_channel',
          priority: 'max',
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[FCM] Successfully sent ${response.successCount} messages; ${response.failureCount} failed.`);
    return true;
  } catch (error) {
    console.error('[FCM] Push notification send error:', error);
    return false;
  }
};
