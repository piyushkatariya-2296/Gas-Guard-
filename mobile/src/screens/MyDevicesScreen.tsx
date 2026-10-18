import React from 'react';
import { Plus, ChevronRight, Cpu, Wifi, Flame, ShieldCheck, Battery } from 'lucide-react';
import { Device } from '../types';
import { soundMgr } from '../services/soundManager';

interface MyDevicesScreenProps {
  devices: Device[];
  onSelectDevice: (device: Device) => void;
  onAddDevice: () => void;
}

export const MyDevicesScreen: React.FC<MyDevicesScreenProps> = ({ devices, onSelectDevice, onAddDevice }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>My Detectors</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {devices.length} Connected ESP32 GasGuard Units
          </p>
        </div>
        <button
          onClick={() => {
            soundMgr.playTap();
            onAddDevice();
          }}
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: '0.82rem' }}
        >
          <Plus size={16} />
          <span>Add New</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {devices.map((device) => {
          const isCritical = device.status === 'GAS_DETECTED';
          const isWarning = device.status === 'WARNING';
          const isOffline = device.status === 'OFFLINE';

          return (
            <div
              key={device.deviceId}
              onClick={() => {
                soundMgr.playTap();
                onSelectDevice(device);
              }}
              className="human-card interactive"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: isCritical
                      ? 'var(--danger-bg)'
                      : isWarning
                      ? 'var(--warning-bg)'
                      : isOffline
                      ? 'var(--offline-bg)'
                      : 'var(--safe-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Flame
                    size={24}
                    color={
                      isCritical
                        ? 'var(--danger-crimson)'
                        : isWarning
                        ? 'var(--warning-amber)'
                        : isOffline
                        ? 'var(--offline-slate)'
                        : 'var(--safe-emerald)'
                    }
                  />
                </div>

                <div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>{device.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{device.deviceId}</span>
                    <span>•</span>
                    <span>{device.sensorType || 'MQ-6'}</span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Wifi size={12} color={isOffline ? 'var(--text-subtle)' : 'var(--safe-emerald)'} />
                      {isOffline ? 'Offline' : `${device.wifiRssi || -52} dBm`}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  className={`status-pill ${
                    isCritical ? 'critical' : isWarning ? 'warning' : isOffline ? 'offline' : 'safe'
                  }`}
                >
                  {isCritical ? 'LEAK' : device.status}
                </span>
                <ChevronRight size={18} color="var(--text-subtle)" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
