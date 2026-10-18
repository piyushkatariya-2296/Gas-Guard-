import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  Wifi, 
  Plus, 
  ChevronRight, 
  PhoneCall, 
  VolumeX, 
  Volume2, 
  Activity, 
  RefreshCw,
  Sparkles,
  Info,
  Bluetooth,
  Globe
} from 'lucide-react';
import { Device, Alert, ActiveTab } from '../types';
import { soundMgr } from '../services/soundManager';
import { bleService } from '../bluetooth/bleManager';

interface HomeScreenProps {
  devices: Device[];
  alerts: Alert[];
  onNavigate: (tab: ActiveTab) => void;
  onSelectDevice: (device: Device) => void;
  onTriggerEmergencyCall: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  devices,
  alerts,
  onNavigate,
  onSelectDevice,
  onTriggerEmergencyCall
}) => {
  // Simulated interactive gas concentration (PPM / ADC)
  const [livePpm, setLivePpm] = useState<number>(240);
  const [isSimulatingLeak, setIsSimulatingLeak] = useState<boolean>(false);
  const [silenceCountdown, setSilenceCountdown] = useState<number>(0);
  const [isSelfTesting, setIsSelfTesting] = useState<boolean>(false);

  // Time-of-day greeting
  const [greeting, setGreeting] = useState<string>('Good day');
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Handle gas simulation logic
  useEffect(() => {
    if (isSimulatingLeak) {
      soundMgr.startAlarmTone();
      const interval = setInterval(() => {
        setLivePpm((prev) => {
          if (prev < 1650) return prev + 120;
          return 1650 + Math.floor(Math.random() * 80);
        });
      }, 500);
      return () => {
        clearInterval(interval);
        soundMgr.stopAlarm();
      };
    } else {
      soundMgr.stopAlarm();
      const interval = setInterval(() => {
        setLivePpm(Math.floor(220 + Math.random() * 35));
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isSimulatingLeak]);

  // Silence timer countdown
  useEffect(() => {
    if (silenceCountdown > 0) {
      const timer = setTimeout(() => setSilenceCountdown(silenceCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [silenceCountdown]);

  // Real Physical Hardware BLE Telemetry Listener
  const [isBleHardwareLinked, setIsBleHardwareLinked] = useState<boolean>(bleService.isHardwareConnected());
  useEffect(() => {
    const unsub = bleService.onTelemetry((data) => {
      setIsBleHardwareLinked(true);
      if (!isSimulatingLeak) {
        setLivePpm(data.gasValue);
        if (data.buzzer) soundMgr.startAlarmTone();
        else soundMgr.stopAlarm();
      }
    });
    return unsub;
  }, [isSimulatingLeak]);

  const handleSilence = () => {
    soundMgr.playTap();
    soundMgr.stopAlarm();
    setSilenceCountdown(60);
  };

  const handleSelfTest = () => {
    soundMgr.playTap();
    setIsSelfTesting(true);
    setTimeout(() => {
      setIsSelfTesting(false);
      soundMgr.playSuccessChime();
    }, 2500);
  };

  // Determine current atmospheric safety state
  let currentStatus: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';
  if (livePpm >= 1400) currentStatus = 'CRITICAL';
  else if (livePpm >= 800) currentStatus = 'WARNING';

  // Calculate SVG circular gauge parameters
  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  const maxPpmScale = 2000;
  const progressRatio = Math.min(livePpm / maxPpmScale, 1);
  const strokeDashoffset = circumference - progressRatio * (circumference * 0.75);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Human Warm Greeting Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {greeting}, Piyush 👋
          </span>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '2px', letterSpacing: '-0.02em' }}>
            Home Atmosphere
          </h2>
        </div>

        <button
          onClick={() => onNavigate('add-device')}
          className="btn-secondary"
          style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          title="Add Detector"
        >
          <Plus size={16} />
          <span>Add</span>
        </button>
      </div>

      {/* Main Central Radial Safety Dial Card */}
      <div
        className="human-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 16px',
          background:
            currentStatus === 'CRITICAL'
              ? 'linear-gradient(180deg, rgba(244,63,94,0.18) 0%, var(--bg-surface) 100%)'
              : currentStatus === 'WARNING'
              ? 'linear-gradient(180deg, rgba(245,158,11,0.18) 0%, var(--bg-surface) 100%)'
              : 'linear-gradient(180deg, rgba(16,185,129,0.14) 0%, var(--bg-surface) 100%)',
          borderColor:
            currentStatus === 'CRITICAL'
              ? 'var(--danger-border)'
              : currentStatus === 'WARNING'
              ? 'var(--warning-border)'
              : 'var(--safe-border)',
          boxShadow:
            currentStatus === 'CRITICAL'
              ? 'var(--danger-glow)'
              : currentStatus === 'WARNING'
              ? 'var(--warning-glow)'
              : 'var(--safe-glow)'
        }}
      >
        {/* Connection Mode Pill: Local Proximity vs Global Long-Distance */}
        <div style={{ marginBottom: '14px' }}>
          {isBleHardwareLinked ? (
            <span className="status-pill safe" style={{ fontSize: '0.72rem', gap: '5px', padding: '4px 10px' }}>
              <Bluetooth size={12} color="var(--brand-primary)" />
              <span>Physical BLE Proximity Active ({bleService.getConnectedDeviceName()})</span>
            </span>
          ) : (
            <span className="status-pill safe" style={{ fontSize: '0.72rem', gap: '5px', padding: '4px 10px' }}>
              <Globe size={12} color="var(--safe-emerald)" />
              <span>Long-Distance Wi-Fi & Cloud Active</span>
            </span>
          )}
        </div>

        {/* SVG Circular Safety Gauge */}
        <div style={{ position: 'relative', width: '210px', height: '210px' }}>
          <svg width="210" height="210" viewBox="0 0 210 210" style={{ transform: 'rotate(135deg)' }}>
            {/* Background Track Arc */}
            <circle
              cx="105"
              cy="105"
              r={radius}
              fill="transparent"
              stroke="var(--border-subtle)"
              strokeWidth="14"
              strokeDasharray={circumference * 0.75}
              strokeDashoffset="0"
              strokeLinecap="round"
            />
            {/* Active Colored Arc */}
            <circle
              cx="105"
              cy="105"
              r={radius}
              fill="transparent"
              stroke={
                currentStatus === 'CRITICAL'
                  ? 'var(--danger-crimson)'
                  : currentStatus === 'WARNING'
                  ? 'var(--warning-amber)'
                  : 'var(--safe-emerald)'
              }
              strokeWidth="14"
              strokeDasharray={circumference * 0.75}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
            />
          </svg>

          {/* Center Readout Display */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background:
                  currentStatus === 'CRITICAL'
                    ? 'var(--danger-bg)'
                    : currentStatus === 'WARNING'
                    ? 'var(--warning-bg)'
                    : 'var(--safe-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '4px'
              }}
            >
              {currentStatus === 'CRITICAL' && <Flame size={20} color="var(--danger-crimson)" />}
              {currentStatus === 'WARNING' && <AlertTriangle size={20} color="var(--warning-amber)" />}
              {currentStatus === 'SAFE' && <ShieldCheck size={20} color="var(--safe-emerald)" />}
            </div>

            <div style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
              {livePpm}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PPM • MQ-6 Sensor
            </span>
          </div>
        </div>

        {/* Dynamic Status Pill */}
        <div style={{ marginTop: '8px' }}>
          {currentStatus === 'SAFE' && (
            <span className="status-pill safe">
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'currentColor' }} />
              Fresh Air • Normal & Safe
            </span>
          )}
          {currentStatus === 'WARNING' && (
            <span className="status-pill warning">
              <AlertTriangle size={12} />
              Elevated Vapor • Monitoring
            </span>
          )}
          {currentStatus === 'CRITICAL' && (
            <span className="status-pill critical">
              <Flame size={12} />
              Hazardous Gas Concentration
            </span>
          )}
        </div>

        {/* Diagnostic Self-Test / Leak Simulation Interactive Bar */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '18px', width: '100%' }}>
          <button
            onClick={() => {
              soundMgr.playTap();
              setIsSimulatingLeak(!isSimulatingLeak);
            }}
            className={isSimulatingLeak ? 'btn-emergency' : 'btn-secondary'}
            style={{ flex: 1, fontSize: '0.8rem', padding: '10px 12px' }}
          >
            <Flame size={15} />
            <span>{isSimulatingLeak ? 'Stop Simulation' : 'Simulate Gas Leak'}</span>
          </button>

          <button
            onClick={handleSelfTest}
            disabled={isSelfTesting}
            className="btn-secondary"
            style={{ flex: 1, fontSize: '0.8rem', padding: '10px 12px' }}
          >
            <RefreshCw size={15} className={isSelfTesting ? 'spin' : ''} />
            <span>{isSelfTesting ? 'Testing Hardware...' : 'Self-Test HW'}</span>
          </button>
        </div>
      </div>

      {/* Quick Action Dock */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <button
          onClick={() => {
            soundMgr.playTap();
            onTriggerEmergencyCall();
          }}
          className="human-card interactive"
          style={{
            padding: '14px 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'center',
            cursor: 'pointer',
            border: 'none',
            background: 'linear-gradient(145deg, rgba(244,63,94,0.15) 0%, var(--bg-surface) 100%)',
            borderColor: 'rgba(244,63,94,0.3)'
          }}
        >
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhoneCall size={18} color="var(--danger-crimson)" />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>SOS 112</span>
        </button>

        <button
          onClick={handleSilence}
          className="human-card interactive"
          style={{
            padding: '14px 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'center',
            cursor: 'pointer',
            border: 'none'
          }}
        >
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {silenceCountdown > 0 ? <VolumeX size={18} color="var(--warning-amber)" /> : <Volume2 size={18} color="var(--warning-amber)" />}
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {silenceCountdown > 0 ? `Silenced (${silenceCountdown}s)` : 'Silence Buzzer'}
          </span>
        </button>

        <button
          onClick={() => {
            soundMgr.playTap();
            onNavigate('live');
          }}
          className="human-card interactive"
          style={{
            padding: '14px 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'center',
            cursor: 'pointer',
            border: 'none'
          }}
        >
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={18} color="#818cf8" />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>Live Wave</span>
        </button>
      </div>

      {/* Emergency Action Guide Banner (Visible when warning or critical) */}
      {(currentStatus === 'CRITICAL' || currentStatus === 'WARNING') && (
        <div
          className="human-card"
          style={{
            background: 'linear-gradient(135deg, rgba(244,63,94,0.15) 0%, rgba(245,158,11,0.1) 100%)',
            borderColor: 'var(--danger-crimson)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <AlertTriangle size={22} color="var(--danger-crimson)" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Safety Action Protocol</h4>
          </div>
          <ol style={{ paddingLeft: '20px', fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text-main)' }}>
            <li>Immediately <strong>close the gas cylinder regulator knob</strong>.</li>
            <li><strong>Open all windows and doors</strong> for rapid natural cross-ventilation.</li>
            <li><strong>Do NOT touch electrical switches</strong>, lighters, or open flames.</li>
            <li>Evacuate to an open space and dial emergency services (112).</li>
          </ol>
        </div>
      )}

      {/* Active Hardware Detectors List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
            Installed Detectors ({devices.length})
          </h3>
          <button
            onClick={() => onNavigate('devices')}
            style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Manage All
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {devices.map((dev) => (
            <div
              key={dev.deviceId}
              onClick={() => {
                soundMgr.playTap();
                onSelectDevice(dev);
              }}
              className="human-card interactive"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background:
                      dev.status === 'GAS_DETECTED'
                        ? 'var(--danger-bg)'
                        : dev.status === 'WARNING'
                        ? 'var(--warning-bg)'
                        : dev.status === 'OFFLINE'
                        ? 'var(--offline-bg)'
                        : 'var(--safe-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Flame
                    size={22}
                    color={
                      dev.status === 'GAS_DETECTED'
                        ? 'var(--danger-crimson)'
                        : dev.status === 'WARNING'
                        ? 'var(--warning-amber)'
                        : dev.status === 'OFFLINE'
                        ? 'var(--offline-slate)'
                        : 'var(--safe-emerald)'
                    }
                  />
                </div>

                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>{dev.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{dev.deviceId}</span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Wifi size={12} color="var(--safe-emerald)" />
                      {dev.wifiRssi ? `${dev.wifiRssi} dBm` : 'Connected'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  className={`status-pill ${
                    dev.status === 'GAS_DETECTED'
                      ? 'critical'
                      : dev.status === 'WARNING'
                      ? 'warning'
                      : dev.status === 'OFFLINE'
                      ? 'offline'
                      : 'safe'
                  }`}
                >
                  {dev.status === 'GAS_DETECTED' ? 'LEAK' : dev.status}
                </span>
                <ChevronRight size={18} color="var(--text-subtle)" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Insight Pill */}
      <div
        className="human-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--bg-surface-elevated)',
          padding: '12px 16px'
        }}
      >
        <Sparkles size={20} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          <strong>Pro-tip:</strong> MQ-6 sensors reach peak accuracy after 3 minutes of warm-up heating. Both remote MQTT & local offline buzzer safety alarms are active.
        </p>
      </div>
    </div>
  );
};
