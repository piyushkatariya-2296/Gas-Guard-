import { User, Device, Reading, Alert } from '../types';

const API_BASE = 'http://localhost:5000/api';

class ApiService {
  private token: string | null = localStorage.getItem('gasguard_jwt_token');

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('gasguard_jwt_token', token);
    } else {
      localStorage.removeItem('gasguard_jwt_token');
    }
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('gasguard_jwt_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Network response error');
      }

      return data as T;
    } catch (err: any) {
      console.warn(`[API] Fallback mode triggered for ${endpoint}:`, err.message);
      throw err;
    }
  }

  // Auth APIs
  async register(name: string, email: string, password: string) {
    return this.request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Device APIs
  async getDevices(): Promise<{ devices: Device[] }> {
    return this.request<{ devices: Device[] }>('/devices');
  }

  async addDevice(deviceId: string, name: string, sensorType = 'MQ-6') {
    return this.request<{ message: string; device: Device }>('/devices', {
      method: 'POST',
      body: JSON.stringify({ deviceId, name, sensorType }),
    });
  }

  async getDeviceDetails(deviceId: string) {
    return this.request<{ device: Device }>(`/devices/${deviceId}`);
  }

  async updateDevice(deviceId: string, updates: Partial<Device>) {
    return this.request<{ message: string; device: Device }>(`/devices/${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async shareDevice(deviceId: string, email: string, role: 'ADMIN' | 'VIEWER') {
    return this.request<{ message: string }>(`/devices/${deviceId}/share`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  // Reading & Alert APIs
  async getDeviceReadings(deviceId: string, range = 'today') {
    return this.request<{ deviceId: string; readings: Reading[] }>(`/devices/${deviceId}/readings?range=${range}`);
  }

  async getUserAlerts() {
    return this.request<{ alerts: Alert[] }>('/alerts');
  }

  async acknowledgeAlert(alertId: string) {
    return this.request<{ message: string }>(`/alerts/${alertId}/ack`, {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
