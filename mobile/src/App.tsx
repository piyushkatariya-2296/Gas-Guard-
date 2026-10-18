import React, { useState, useEffect } from 'react';
import { SplashScreen } from './screens/SplashScreen';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { AddDeviceScreen } from './screens/AddDeviceScreen';
import { MyDevicesScreen } from './screens/MyDevicesScreen';
import { DeviceDetailsScreen } from './screens/DeviceDetailsScreen';
import { LiveMonitoringScreen } from './screens/LiveMonitoringScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { AlertsScreen } from './screens/AlertsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { BottomNav } from './components/BottomNav';
import { User, Device, Alert, ActiveTab } from './types';
import { api } from './services/api';
import { soundMgr } from './services/soundManager';
import { 
  Flame, 
  Bell, 
  Smartphone, 
  Maximize2, 
  Moon, 
  Sun, 
  PhoneCall, 
  X, 
  ShieldAlert, 
  Wifi, 
  Battery, 
  Share2 
} from 'lucide-react';

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  // Appearance & View Controls
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currentTime, setCurrentTime] = useState<string>('9:41');
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);

  // Live status bar clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Theme attribute application
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initial devices state with human room names
  const [devices, setDevices] = useState<Device[]>([
    {
      deviceId: 'GG-000001',
      name: 'Kitchen Stove Detector',
      ownerId: 'user_123',
      sensorType: 'MQ-6',
      gasProfile: 'LPG / Butane / Propane',
      firmwareVersion: '1.0.0',
      status: 'SAFE',
      warningThreshold: 1000,
      criticalThreshold: 1500,
      lastSeen: new Date().toISOString(),
      wifiRssi: -52,
      userRole: 'OWNER'
    },
    {
      deviceId: 'GG-000002',
      name: 'Living Room Fireplace',
      ownerId: 'user_123',
      sensorType: 'MQ-6',
      gasProfile: 'LPG',
      firmwareVersion: '1.0.0',
      status: 'SAFE',
      warningThreshold: 1000,
      criticalThreshold: 1500,
      lastSeen: new Date(Date.now() - 40000).toISOString(),
      wifiRssi: -64,
      userRole: 'OWNER'
    },
    {
      deviceId: 'GG-000003',
      name: 'Workshop Cylinder Bay',
      ownerId: 'user_123',
      sensorType: 'MQ-6',
      gasProfile: 'LPG',
      firmwareVersion: '1.0.0',
      status: 'SAFE',
      warningThreshold: 1000,
      criticalThreshold: 1500,
      lastSeen: new Date(Date.now() - 120000).toISOString(),
      wifiRssi: -78,
      userRole: 'VIEWER'
    }
  ]);

  const [alerts, setAlerts] = useState<Alert[]>([
    {
      _id: 'alert_1',
      deviceId: 'GG-000002',
      userId: 'user_123',
      type: 'WARNING_LEVEL',
      gasValue: 840,
      status: 'WARNING',
      message: 'Notice: Slight vapor concentration rise detected in Living Room (840 PPM).',
      acknowledged: true,
      timestamp: new Date(Date.now() - 1800000).toISOString()
    }
  ]);

  useEffect(() => {
    if (user) {
      api.getDevices().then((res) => {
        if (res.devices && res.devices.length > 0) setDevices(res.devices);
      }).catch(() => {});

      api.getUserAlerts().then((res) => {
        if (res.alerts && res.alerts.length > 0) setAlerts(res.alerts);
      }).catch(() => {});
    }
  }, [user]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  const unackAlertCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="app-viewport-wrapper">
      {/* Desktop Preview Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '14px',
          background: 'var(--bg-surface)',
          padding: '6px 16px',
          borderRadius: '999px',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--text-muted)'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Flame size={15} color="var(--brand-primary)" />
          GasGuard Mobile
        </span>

        <span style={{ color: 'var(--border-strong)' }}>|</span>

        <button
          onClick={() => {
            soundMgr.playTap();
            setIsPhoneFrame(!isPhoneFrame);
          }}
          style={{ background: 'none', border: 'none', color: isPhoneFrame ? 'var(--brand-primary)' : 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}
        >
          {isPhoneFrame ? <Smartphone size={14} /> : <Maximize2 size={14} />}
          <span>{isPhoneFrame ? 'Phone Frame' : 'Full Width'}</span>
        </button>

        <span style={{ color: 'var(--border-strong)' }}>|</span>

        <button
          onClick={() => {
            soundMgr.playTap();
            setTheme(theme === 'dark' ? 'light' : 'dark');
          }}
          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}
        >
          {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
          <span>{theme === 'dark' ? 'Warm Dark' : 'Daylight'}</span>
        </button>
      </div>

      {/* Realistic Mobile Device Container */}
      <div className={`device-shell ${!isPhoneFrame ? 'fluid-view' : ''}`}>
        {/* Mobile Top Status Bar */}
        <div className="mobile-status-bar">
          <span>{currentTime}</span>

          {/* Dynamic Island */}
          <div
            className="dynamic-island"
            onClick={() => {
              soundMgr.playTap();
              setActiveTab('home');
            }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--safe-emerald)' }} />
            <Flame size={12} color="var(--brand-primary)" />
            <span style={{ fontSize: '0.65rem', color: '#ffffff', fontWeight: 800 }}>LIVE</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem' }}>5G</span>
            <Wifi size={13} />
            <span style={{ fontSize: '0.75rem' }}>98%</span>
          </div>
        </div>

        {/* Top App Header */}
        {user && (
          <header className="app-header">
            <div
              onClick={() => {
                soundMgr.playTap();
                setActiveTab('home');
                setSelectedDevice(null);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'var(--brand-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--brand-glow)'
                }}
              >
                <Flame size={18} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  GasGuard
                </h1>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>IoT Safety Fleet</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => {
                  soundMgr.playTap();
                  setActiveTab('alerts');
                }}
                style={{ position: 'relative', background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '6px' }}
                aria-label="Alerts"
              >
                <Bell size={20} />
                {unackAlertCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: 'var(--danger-crimson)',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%'
                    }}
                  />
                )}
              </button>
            </div>
          </header>
        )}

        {/* Main Screen Content */}
        <main className="screen-scroll-container">
          {!user ? (
            <LoginScreen onLoginSuccess={(u) => setUser(u)} />
          ) : selectedDevice ? (
            <DeviceDetailsScreen
              device={selectedDevice}
              onBack={() => setSelectedDevice(null)}
              onDeviceUpdated={(updated) => {
                setDevices((prev) => prev.map((d) => (d.deviceId === updated.deviceId ? updated : d)));
                setSelectedDevice(updated);
              }}
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeScreen
                  devices={devices}
                  alerts={alerts}
                  onNavigate={(t) => setActiveTab(t)}
                  onSelectDevice={(d) => setSelectedDevice(d)}
                  onTriggerEmergencyCall={() => setShowEmergencyModal(true)}
                />
              )}

              {activeTab === 'add-device' && (
                <AddDeviceScreen
                  onBack={() => setActiveTab('home')}
                  onDeviceAdded={(newDev) => {
                    setDevices((prev) => [newDev, ...prev]);
                    setActiveTab('devices');
                  }}
                />
              )}

              {activeTab === 'devices' && (
                <MyDevicesScreen
                  devices={devices}
                  onSelectDevice={(d) => setSelectedDevice(d)}
                  onAddDevice={() => setActiveTab('add-device')}
                />
              )}

              {activeTab === 'live' && <LiveMonitoringScreen devices={devices} />}

              {activeTab === 'history' && <HistoryScreen devices={devices} />}

              {activeTab === 'alerts' && (
                <AlertsScreen
                  alerts={alerts}
                  onAcknowledgeAlert={(id) => {
                    setAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, acknowledged: true } : a)));
                  }}
                  onEmergencyCall={() => setShowEmergencyModal(true)}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsScreen
                  user={user}
                  onLogout={() => {
                    api.setToken(null);
                    setUser(null);
                  }}
                  currentTheme={theme}
                  onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                />
              )}
            </>
          )}
        </main>

        {/* Bottom Floating Navigation Bar */}
        {user && (
          <BottomNav
            activeTab={activeTab}
            onTabChange={(tab) => {
              soundMgr.playTap();
              setSelectedDevice(null);
              setActiveTab(tab);
            }}
            alertBadgeCount={unackAlertCount}
          />
        )}

        {/* iPhone Gesture Home Indicator Bar */}
        <div className="home-indicator-bar" />
      </div>

      {/* Emergency Action Modal Sheet */}
      {showEmergencyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999
          }}
        >
          <div
            className="human-card"
            style={{
              width: '100%',
              maxWidth: '380px',
              padding: '24px 20px',
              border: '2px solid var(--danger-crimson)',
              boxShadow: 'var(--danger-glow)',
              textAlign: 'center'
            }}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--danger-bg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <PhoneCall size={28} color="var(--danger-crimson)" />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--danger-crimson)' }}>
              Emergency SOS Triggered
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px', marginBottom: '20px', lineHeight: 1.5 }}>
              Immediate priority assistance for hazardous gas leaks or residential danger.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href="tel:112"
                onClick={() => soundMgr.playTap()}
                className="btn-emergency"
                style={{ width: '100%', padding: '14px', textDecoration: 'none' }}
              >
                <PhoneCall size={18} />
                <span>Call Fire & Emergency (112)</span>
              </a>

              <a
                href="tel:+919876543210"
                onClick={() => soundMgr.playTap()}
                className="btn-secondary"
                style={{ width: '100%', padding: '12px', textDecoration: 'none' }}
              >
                <Share2 size={16} />
                <span>Call Emergency Contact</span>
              </a>

              <button
                onClick={() => {
                  soundMgr.playTap();
                  setShowEmergencyModal(false);
                }}
                className="btn-secondary"
                style={{ width: '100%', padding: '12px', marginTop: '6px' }}
              >
                <span>Dismiss / I am in a Safe Area</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
