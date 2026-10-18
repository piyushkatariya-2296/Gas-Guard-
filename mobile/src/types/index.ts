export type DeviceStatus = 'SAFE' | 'WARNING' | 'GAS_DETECTED' | 'OFFLINE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface Device {
  deviceId: string;
  name: string;
  ownerId: string;
  sensorType: string;
  gasProfile: string;
  firmwareVersion: string;
  status: DeviceStatus;
  warningThreshold: number;
  criticalThreshold: number;
  lastSeen: string;
  wifiRssi?: number;
  batteryLevel?: number;
  userRole?: 'OWNER' | 'ADMIN' | 'VIEWER';
}

export interface Reading {
  _id?: string;
  deviceId: string;
  gasValue: number;
  rawAdc?: number;
  status: DeviceStatus;
  buzzer: boolean;
  wifiRssi?: number;
  timestamp: string;
}

export interface Alert {
  _id: string;
  deviceId: string;
  userId: string;
  type: 'GAS_LEAK' | 'WARNING_LEVEL' | 'DEVICE_OFFLINE' | 'LOW_BATTERY';
  gasValue?: number;
  status: DeviceStatus;
  message: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  timestamp: string;
}

export type ActiveTab = 'home' | 'devices' | 'add-device' | 'live' | 'history' | 'alerts' | 'settings';
