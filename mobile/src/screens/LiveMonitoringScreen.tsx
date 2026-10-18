import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Flame, AlertTriangle, Wifi, Sliders, Zap, Volume2, VolumeX } from 'lucide-react';
import { Device, Reading } from '../types';
import { soundMgr } from '../services/soundManager';

interface LiveMonitoringScreenProps {
  devices: Device[];
}

export const LiveMonitoringScreen: React.FC<LiveMonitoringScreenProps> = ({ devices }) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(devices[0]?.deviceId || 'GG-000001');
  const [liveValue, setLiveValue] = useState<number>(340);
  const [wavePoints, setWavePoints] = useState<number[]>([320, 335, 340, 325, 350, 360, 345, 330, 355, 340, 330, 345, 350, 335, 340]);
  const [isBuzzerActive, setIsBuzzerActive] = useState<boolean>(false);
  const [injectedGas, setInjectedGas] = useState<number>(0);

  // Real-time wave generation
  useEffect(() => {
    const interval = setInterval(() => {
      const baseNoise = Math.floor(Math.sin(Date.now() / 600) * 25 + (Math.random() * 20 - 10));
      const nextVal = Math.max(100, 320 + injectedGas + baseNoise);
      setLiveValue(nextVal);
      setWavePoints((prev) => [...prev.slice(1), nextVal]);
      setIsBuzzerActive(nextVal > 1000);
    }, 700);

    return () => clearInterval(interval);
  }, [injectedGas]);

  const activeDevice = devices.find((d) => d.deviceId === selectedDeviceId) || devices[0];
  const isCritical = liveValue >= 1400;
  const isWarning = liveValue >= 800 && liveValue < 1400;

  // Generate SVG path for waveform
  const svgWidth = 340;
  const svgHeight = 140;
  const maxVal = 2000;
  const points = wavePoints.map((val, idx) => {
    const x = (idx / (wavePoints.length - 1)) * svgWidth;
    const y = svgHeight - (Math.min(val, maxVal) / maxVal) * (svgHeight - 20) - 10;
    return `${x},${y}`;
  });
  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${svgWidth},${svgHeight} L 0,${svgHeight} Z`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Screen Title */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Live Sensor Waveform</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Real-time MQ-6 ADC & Telemetry Stream (700ms pulse)
        </p>
      </div>

      {/* Device Selector Pill Bar */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {devices.map((d) => (
          <button
            key={d.deviceId}
            onClick={() => {
              soundMgr.playTap();
              setSelectedDeviceId(d.deviceId);
            }}
            className={`btn-secondary ${selectedDeviceId === d.deviceId ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
              background: selectedDeviceId === d.deviceId ? 'var(--brand-primary)' : 'var(--bg-surface)',
              color: selectedDeviceId === d.deviceId ? 'white' : 'var(--text-main)',
              borderColor: selectedDeviceId === d.deviceId ? 'var(--brand-primary)' : 'var(--border-subtle)'
            }}
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* Oscilloscope Waveform Card */}
      <div
        className="human-card"
        style={{
          padding: '20px 16px',
          borderColor: isCritical ? 'var(--danger-border)' : isWarning ? 'var(--warning-border)' : 'var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Current Reading
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.03em', color: isCritical ? 'var(--danger-crimson)' : isWarning ? 'var(--warning-amber)' : 'var(--text-main)' }}>
                {liveValue}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700 }}>PPM</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              className={`status-pill ${isCritical ? 'critical' : isWarning ? 'warning' : 'safe'}`}
              style={{ fontSize: '0.72rem' }}
            >
              {isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'SAFE'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Wifi size={13} color="var(--safe-emerald)" />
              <span>-54 dBm</span>
            </div>
          </div>
        </div>

        {/* Live SVG Graph Canvas */}
        <div style={{ position: 'relative', width: '100%', height: '140px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
          {/* Subtle Gridlines */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)', backgroundSize: '34px 28px', opacity: 0.5 }} />

          <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isCritical ? 'var(--danger-crimson)' : isWarning ? 'var(--warning-amber)' : 'var(--brand-primary)'} stopOpacity="0.4" />
                <stop offset="100%" stopColor={isCritical ? 'var(--danger-crimson)' : isWarning ? 'var(--warning-amber)' : 'var(--brand-primary)'} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Filled Area */}
            <path d={areaD} fill="url(#waveGradient)" />

            {/* Smooth Curve Stroke */}
            <path
              d={pathD}
              fill="none"
              stroke={isCritical ? 'var(--danger-crimson)' : isWarning ? 'var(--warning-amber)' : 'var(--brand-primary)'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Hardware Status Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>MQ-6 Heater</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--safe-emerald)' }}>STABLE (5V)</span>
          </div>
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Local Buzzer</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isBuzzerActive ? 'var(--danger-crimson)' : 'var(--text-muted)' }}>
              {isBuzzerActive ? 'ACTIVE 🔊' : 'QUIET'}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Sample Rate</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>1.4 Hz</span>
          </div>
        </div>
      </div>

      {/* Interactive Gas Injection Slider (Demo & Calibration Tool) */}
      <div className="human-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sliders size={16} color="var(--brand-primary)" />
            <span>Simulate Gas Exposure Level</span>
          </h4>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
            +{injectedGas} PPM
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="1500"
          step="50"
          value={injectedGas}
          onChange={(e) => setInjectedGas(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: 'var(--brand-primary)',
            height: '6px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
          <span>Clean Ambient (0)</span>
          <span>Warning (600+)</span>
          <span>Critical Alarm (1200+)</span>
        </div>
      </div>
    </div>
  );
};
