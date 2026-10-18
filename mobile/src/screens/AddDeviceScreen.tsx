import React, { useState } from 'react';
import { Bluetooth, Wifi, CheckCircle2, Loader2, ArrowLeft, Eye, EyeOff, Radio, ShieldCheck } from 'lucide-react';
import { bleService, BleDeviceDescriptor } from '../bluetooth/bleManager';
import { api } from '../services/api';
import { Device } from '../types';
import { soundMgr } from '../services/soundManager';

interface AddDeviceScreenProps {
  onBack: () => void;
  onDeviceAdded: (device: Device) => void;
}

export const AddDeviceScreen: React.FC<AddDeviceScreenProps> = ({ onBack, onDeviceAdded }) => {
  const [step, setStep] = useState<'scan' | 'wifi' | 'provisioning' | 'success'>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<BleDeviceDescriptor[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<BleDeviceDescriptor | null>(null);

  const [deviceName, setDeviceName] = useState('Kitchen Stove GasGuard');
  const [wifiSsid, setWifiSsid] = useState('Home_5G_WiFi');
  const [wifiPass, setWifiPass] = useState('GasGuardSafe2026');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const startBleScan = async () => {
    soundMgr.playTap();
    setIsScanning(true);
    setError('');
    try {
      const devices = await bleService.scanForDevices();
      setDiscoveredDevices(devices);
      soundMgr.playSuccessChime();
    } catch (err: any) {
      setError('Bluetooth scan cancelled or unavailable. Using simulated discovery.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectDevice = (device: BleDeviceDescriptor) => {
    soundMgr.playTap();
    setSelectedDevice(device);
    setStep('wifi');
  };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wifiSsid) {
      setError('Please provide a Wi-Fi SSID');
      return;
    }

    soundMgr.playTap();
    setStep('provisioning');
    setError('');

    try {
      // 1. Transmit credentials to ESP32 over BLE GATT
      await bleService.connectAndProvision(selectedDevice?.id || 'GG-000001', wifiSsid, wifiPass);

      // 2. Claim device on Cloud Backend
      const res = await api.addDevice(selectedDevice?.id || 'GG-000001', deviceName);
      soundMgr.playSuccessChime();
      setStep('success');

      setTimeout(() => {
        onDeviceAdded(res.device || {
          deviceId: selectedDevice?.id || 'GG-000001',
          name: deviceName,
          ownerId: 'user_123',
          sensorType: 'MQ-6',
          gasProfile: 'LPG/Iso-butane/Propane',
          firmwareVersion: '1.0.0',
          status: 'SAFE',
          warningThreshold: 1000,
          criticalThreshold: 1500,
          lastSeen: new Date().toISOString(),
          wifiRssi: -52,
          userRole: 'OWNER'
        });
      }, 1600);
    } catch (err: any) {
      setError('Failed to provision device: ' + err.message);
      setStep('wifi');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
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
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Pair New Detector</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Bluetooth Low Energy (BLE) Setup
          </span>
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger-crimson)', padding: '12px 14px', borderRadius: '12px', fontSize: '0.82rem' }}>
          {error}
        </div>
      )}

      {/* STEP 1: SCAN FOR HARDWARE */}
      {step === 'scan' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>
          {/* Animated Sonar Radar Visual */}
          <div style={{ position: 'relative', width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isScanning && (
              <>
                <div className="radar-circle" style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '2px solid var(--brand-primary)' }} />
                <div className="radar-circle" style={{ position: 'absolute', width: '70%', height: '70%', borderRadius: '50%', border: '2px solid var(--brand-primary)', animationDelay: '0.6s' }} />
              </>
            )}
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: 'var(--brand-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--brand-glow)',
                zIndex: 2
              }}
            >
              <Bluetooth size={42} color="white" />
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Search for GasGuard Hardware</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '300px' }}>
              Ensure your ESP32 detector is powered on. It advertises as <strong>LPG SHIELD</strong> over Bluetooth.
            </p>
          </div>

          <button
            onClick={startBleScan}
            disabled={isScanning}
            className="btn-primary"
            style={{ width: '100%', padding: '14px' }}
          >
            {isScanning ? (
              <>
                <Loader2 size={18} className="spin" />
                <span>Scanning Nearby Radio...</span>
              </>
            ) : (
              <>
                <Radio size={18} />
                <span>Start BLE Discovery</span>
              </>
            )}
          </button>

          {/* Discovered List */}
          {discoveredDevices.length > 0 && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textAlign: 'left', color: 'var(--text-muted)' }}>
                Found Devices ({discoveredDevices.length})
              </span>
              {discoveredDevices.map((d) => (
                <div
                  key={d.id}
                  onClick={() => handleSelectDevice(d)}
                  className="human-card interactive"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--safe-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bluetooth size={20} color="var(--safe-emerald)" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{d.name}</h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Hardware ID: {d.id}</span>
                    </div>
                  </div>

                  <span className="status-pill safe">Pair</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: ENTER WI-FI CREDENTIALS */}
      {step === 'wifi' && (
        <form onSubmit={handleProvision} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="human-card" style={{ background: 'var(--bg-surface-elevated)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Selected Device</span>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-primary)', marginTop: '2px' }}>
              {selectedDevice?.name} ({selectedDevice?.id})
            </h4>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Detector Label / Room Name
            </label>
            <input
              type="text"
              className="human-input"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g. Master Kitchen / Bakery"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Home 2.4GHz Wi-Fi Network (SSID)
            </label>
            <div style={{ position: 'relative' }}>
              <Wifi size={18} color="var(--text-subtle)" style={{ position: 'absolute', left: '14px', top: '15px' }} />
              <input
                type="text"
                className="human-input"
                style={{ paddingLeft: '44px' }}
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                placeholder="SSID Name"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Wi-Fi Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="human-input"
                style={{ paddingRight: '44px' }}
                value={wifiPass}
                onChange={(e) => setWifiPass(e.target.value)}
                placeholder="Network Password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '14px', top: '14px', background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '10px', padding: '14px' }}>
            Send Credentials via BLE
          </button>
        </form>
      )}

      {/* STEP 3: PROVISIONING IN PROGRESS */}
      {step === 'provisioning' && (
        <div className="human-card" style={{ textAlign: 'center', padding: '40px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Loader2 size={46} color="var(--brand-primary)" className="spin" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Configuring ESP32...</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '280px', lineHeight: 1.5 }}>
            Writing Wi-Fi credentials to ESP32 Flash NVS memory and validating cloud MQTT broker connection.
          </p>
        </div>
      )}

      {/* STEP 4: SUCCESS */}
      {step === 'success' && (
        <div className="human-card" style={{ textAlign: 'center', padding: '40px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: 'var(--safe-bg)', borderColor: 'var(--safe-border)' }}>
          <CheckCircle2 size={54} color="var(--safe-emerald)" />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--safe-emerald)' }}>Setup Complete!</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', maxWidth: '280px' }}>
            Detector has connected to Wi-Fi and is actively broadcasting telemetry to the GasGuard Cloud.
          </p>
        </div>
      )}
    </div>
  );
};
