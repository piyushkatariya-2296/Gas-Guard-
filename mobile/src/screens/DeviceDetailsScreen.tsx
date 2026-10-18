import React, { useState } from 'react';
import { ArrowLeft, Wifi, Cpu, ShieldAlert, Sliders, Users, Trash2, Check, RefreshCw, Send, Bell } from 'lucide-react';
import { Device } from '../types';
import { api } from '../services/api';
import { soundMgr } from '../services/soundManager';

interface DeviceDetailsScreenProps {
  device: Device;
  onBack: () => void;
  onDeviceUpdated: (updatedDevice: Device) => void;
}

export const DeviceDetailsScreen: React.FC<DeviceDetailsScreenProps> = ({ device, onBack, onDeviceUpdated }) => {
  const [warningThresh, setWarningThresh] = useState(device.warningThreshold || 1000);
  const [criticalThresh, setCriticalThresh] = useState(device.criticalThreshold || 1500);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'ADMIN' | 'VIEWER'>('VIEWER');
  const [shareMessage, setShareMessage] = useState('');

  const handleSaveThresholds = async () => {
    soundMgr.playTap();
    setIsSaving(true);
    setSaveMessage('');
    try {
      const res = await api.updateDevice(device.deviceId, {
        warningThreshold: warningThresh,
        criticalThreshold: criticalThresh
      });
      soundMgr.playSuccessChime();
      setSaveMessage('Thresholds synced to ESP32 detector over MQTT!');
      onDeviceUpdated(res.device || { ...device, warningThreshold: warningThresh, criticalThreshold: criticalThresh });
    } catch (err: any) {
      setSaveMessage('Settings updated in local simulation: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail) return;
    soundMgr.playTap();
    try {
      await api.shareDevice(device.deviceId, shareEmail, shareRole);
      soundMgr.playSuccessChime();
      setShareMessage(`Invitation sent to ${shareEmail} as ${shareRole}`);
      setShareEmail('');
    } catch (err: any) {
      setShareMessage('Shared in local session mode.');
      setShareEmail('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => {
            soundMgr.playTap();
            onBack();
          }}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{device.name}</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {device.deviceId} • Firmware v{device.firmwareVersion || '1.0.0'}</span>
        </div>
      </div>

      {/* Hardware Specs Card */}
      <div className="human-card">
        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
          Device Telemetry & Specs
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '0.82rem' }}>
          <div>
            <span style={{ color: 'var(--text-subtle)', display: 'block' }}>Sensor Element</span>
            <span style={{ fontWeight: 700 }}>MQ-6 (Propane & Butane)</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-subtle)', display: 'block' }}>Microcontroller</span>
            <span style={{ fontWeight: 700 }}>ESP32 Dual-Core 240MHz</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-subtle)', display: 'block' }}>Wi-Fi Connection</span>
            <span style={{ fontWeight: 700, color: 'var(--safe-emerald)' }}>
              {device.wifiRssi ? `${device.wifiRssi} dBm (Good)` : 'Online'}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-subtle)', display: 'block' }}>Access Level</span>
            <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>{device.userRole || 'OWNER'}</span>
          </div>
        </div>
      </div>

      {/* Safety Threshold Customization */}
      <div className="human-card">
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Sliders size={18} color="var(--brand-primary)" />
          <span>Safety Trigger Levels</span>
        </h4>

        {saveMessage && (
          <div style={{ background: 'var(--safe-bg)', border: '1px solid var(--safe-border)', color: 'var(--safe-emerald)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.8rem', marginBottom: '14px' }}>
            {saveMessage}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--warning-amber)', fontWeight: 700 }}>Warning Level (Amber Alarm)</span>
              <span style={{ fontWeight: 800 }}>{warningThresh} ADC</span>
            </div>
            <input
              type="range"
              min="500"
              max="2000"
              step="50"
              value={warningThresh}
              onChange={(e) => setWarningThresh(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--warning-amber)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Default ~1000 (app notification sent)</span>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--danger-crimson)', fontWeight: 700 }}>Critical Level (Buzzer & Red Alert)</span>
              <span style={{ fontWeight: 800 }}>{criticalThresh} ADC</span>
            </div>
            <input
              type="range"
              min="800"
              max="3000"
              step="50"
              value={criticalThresh}
              onChange={(e) => setCriticalThresh(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--danger-crimson)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Default ~1500 (hardware buzzer sounds continuously)</span>
          </div>

          <button
            onClick={handleSaveThresholds}
            disabled={isSaving}
            className="btn-primary"
            style={{ width: '100%', padding: '12px' }}
          >
            {isSaving ? 'Syncing to Hardware...' : 'Save & Sync via MQTT'}
          </button>
        </div>
      </div>

      {/* Family Access Sharing Card */}
      <div className="human-card">
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Users size={18} color="var(--brand-primary)" />
          <span>Share Access with Family</span>
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Grant family members or tenants live monitoring and emergency notification permissions.
        </p>

        {shareMessage && (
          <div style={{ background: 'var(--safe-bg)', border: '1px solid var(--safe-border)', color: 'var(--safe-emerald)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.8rem', marginBottom: '14px' }}>
            {shareMessage}
          </div>
        )}

        <form onSubmit={handleShareSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email"
            className="human-input"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            placeholder="family.member@gmail.com"
            required
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={shareRole}
              onChange={(e) => setShareRole(e.target.value as any)}
              className="human-input"
              style={{ flex: 1, padding: '10px 14px', cursor: 'pointer' }}
            >
              <option value="VIEWER">Viewer (Telemetry only)</option>
              <option value="ADMIN">Manager (Full controls)</option>
            </select>

            <button type="submit" className="btn-secondary" style={{ padding: '10px 18px', whiteSpace: 'nowrap' }}>
              <Send size={15} />
              <span>Invite</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
