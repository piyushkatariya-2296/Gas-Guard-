import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Bell, 
  Shield, 
  LogOut, 
  Smartphone, 
  Check, 
  Moon, 
  Sun, 
  Volume2, 
  Phone, 
  Download, 
  Laptop, 
  Apple, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';
import { soundMgr } from '../services/soundManager';

interface SettingsScreenProps {
  user: User;
  onLogout: () => void;
  currentTheme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, onLogout, currentTheme, onToggleTheme }) => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [emergencyPhone, setEmergencyPhone] = useState('+91 98765 43210');
  const [isSavedPhone, setIsSavedPhone] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activePlatformTab, setActivePlatformTab] = useState<'android' | 'windows' | 'ios'>('android');

  // Listen for native PWA installation event (Chrome, Edge on Android & Windows)
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPromptEvent(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const triggerNativeInstall = async () => {
    soundMgr.playTap();
    if (installPromptEvent) {
      installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        soundMgr.playSuccessChime();
        setIsInstalled(true);
      }
      setInstallPromptEvent(null);
    } else {
      alert("To install GasGuard:\n• On Windows / Chrome / Edge: Click the 'Install App' icon (⊕) in the browser address bar.\n• On Android: Tap the 3-dots menu (⋮) -> 'Install App' or 'Add to Home Screen'.\n• On iPhone: Tap the Share button (⎋) -> 'Add to Home Screen'.");
    }
  };

  const toggleSound = () => {
    soundMgr.playTap();
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundMgr.setMuted(!next);
  };

  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    soundMgr.playTap();
    soundMgr.playSuccessChime();
    setIsSavedPhone(true);
    setTimeout(() => setIsSavedPhone(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Settings & Safety</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Preferences, Theme & Native App Install</p>
      </div>

      {/* User Profile Card */}
      <div className="human-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'var(--brand-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.4rem',
            color: 'white',
            boxShadow: 'var(--brand-glow)'
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{user.name}</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</span>
          <div style={{ marginTop: '4px' }}>
            <span className="status-pill safe" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
              {user.role} ACCESS
            </span>
          </div>
        </div>
      </div>

      {/* NATIVE APP INSTALL & STORE PACKAGING CARD */}
      <div
        className="human-card"
        style={{
          background: 'linear-gradient(145deg, rgba(249,115,22,0.12) 0%, var(--bg-surface) 100%)',
          borderColor: 'var(--brand-primary)',
          boxShadow: 'var(--brand-glow)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--brand-primary)', fontWeight: 800, textTransform: 'uppercase' }}>
              Native Multi-Platform Deployment
            </span>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '2px' }}>
              Install GasGuard Native App
            </h4>
          </div>
          <Download size={22} color="var(--brand-primary)" />
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '14px' }}>
          GasGuard is configured for native deployment across Android (Play Store APK/AAB), iOS (Xcode project), and Windows desktop.
        </p>

        {/* 1-Tap Direct Install Button */}
        <button
          onClick={triggerNativeInstall}
          className="btn-primary"
          style={{ width: '100%', padding: '12px', marginBottom: '16px' }}
        >
          <Smartphone size={16} />
          <span>{isInstalled ? 'App Already Installed ✓' : '1-Tap Install App on this Device'}</span>
        </button>

        {/* Platform Selector Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-surface-elevated)', padding: '4px', borderRadius: '12px', marginBottom: '12px' }}>
          <button
            onClick={() => { soundMgr.playTap(); setActivePlatformTab('android'); }}
            style={{
              flex: 1,
              background: activePlatformTab === 'android' ? 'var(--brand-primary)' : 'none',
              color: activePlatformTab === 'android' ? 'white' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🤖 Android (Play Store)
          </button>
          <button
            onClick={() => { soundMgr.playTap(); setActivePlatformTab('windows'); }}
            style={{
              flex: 1,
              background: activePlatformTab === 'windows' ? 'var(--brand-primary)' : 'none',
              color: activePlatformTab === 'windows' ? 'white' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🪟 Windows PC
          </button>
          <button
            onClick={() => { soundMgr.playTap(); setActivePlatformTab('ios'); }}
            style={{
              flex: 1,
              background: activePlatformTab === 'ios' ? 'var(--brand-primary)' : 'none',
              color: activePlatformTab === 'ios' ? 'white' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🍏 iOS (App Store)
          </button>
        </div>

        {/* Platform Details */}
        {activePlatformTab === 'android' && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: 1.6, background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: '10px' }}>
            <p><strong>Android Project Location:</strong> <code>mobile/android</code></p>
            <p>• <strong>To open in Android Studio:</strong> File → Open → select folder <code>mobile/android</code>.</p>
            <p>• <strong>To build Play Store bundle:</strong> Build → Generate Signed Bundle / APK → <strong>Android App Bundle (.aab)</strong>.</p>
            <p>• Pre-configured with Bluetooth Scan/Connect, Internet, and Location permissions in <code>AndroidManifest.xml</code>.</p>
          </div>
        )}

        {activePlatformTab === 'windows' && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: 1.6, background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: '10px' }}>
            <p><strong>Windows Native Installation:</strong></p>
            <p>• Open <strong>http://localhost:3000</strong> in Microsoft Edge or Google Chrome on Windows.</p>
            <p>• Click the <strong>"Install GasGuard"</strong> button (⊕) on the right side of the address bar.</p>
            <p>• Installs as a standalone Windows app with Start Menu icon, taskbar pin, and desktop notifications.</p>
          </div>
        )}

        {activePlatformTab === 'ios' && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: 1.6, background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: '10px' }}>
            <p><strong>iOS Xcode Project Location:</strong> <code>mobile/ios</code></p>
            <p>• <strong>Open in Xcode:</strong> <code>mobile/ios/App/App.xcworkspace</code></p>
            <p>• <strong>Or Safari Instant Install:</strong> Open app in Safari on iPhone → Tap <strong>Share (⎋)</strong> → Tap <strong>"Add to Home Screen (⊞)"</strong>.</p>
          </div>
        )}
      </div>

      {/* App Appearance & Theme Card */}
      <div className="human-card">
        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '14px' }}>App Experience</h4>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentTheme === 'dark' ? <Moon size={18} color="var(--brand-primary)" /> : <Sun size={18} color="var(--brand-primary)" />}
            <div>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block' }}>Visual Theme</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {currentTheme === 'dark' ? 'Warm Midnight (Dark)' : 'Clean Studio (Light)'}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              soundMgr.playTap();
              onToggleTheme();
            }}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.78rem' }}
          >
            {currentTheme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Volume2 size={18} color="var(--safe-emerald)" />
            <div>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block' }}>Tactile Sound & Audio</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Buzzer alarms & button clicks</span>
            </div>
          </div>

          <button
            onClick={toggleSound}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.78rem', color: soundEnabled ? 'var(--safe-emerald)' : 'var(--text-subtle)' }}
          >
            {soundEnabled ? 'Enabled' : 'Muted'}
          </button>
        </div>
      </div>

      {/* Emergency Contact Setup Card */}
      <div className="human-card">
        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Phone size={16} color="var(--danger-crimson)" />
          <span>Emergency Contact (Speed Dial)</span>
        </h4>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Configures the phone number dialed when the SOS button is triggered.
        </p>

        <form onSubmit={handleSavePhone} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            className="human-input"
            value={emergencyPhone}
            onChange={(e) => setEmergencyPhone(e.target.value)}
            placeholder="+91 98765 43210"
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-secondary" style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
            {isSavedPhone ? <Check size={16} color="var(--safe-emerald)" /> : 'Save'}
          </button>
        </form>
      </div>

      {/* Push Notifications Card */}
      <div className="human-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={18} color="var(--warning-amber)" />
            <div>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block' }}>Push Notifications</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Emergency alerts on phone lockscreen</span>
            </div>
          </div>

          <button
            onClick={() => {
              soundMgr.playTap();
              setPushEnabled(!pushEnabled);
            }}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.78rem', color: pushEnabled ? 'var(--safe-emerald)' : 'var(--text-subtle)' }}
          >
            {pushEnabled ? 'Active' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Logout Action */}
      <button
        onClick={() => {
          soundMgr.playTap();
          onLogout();
        }}
        className="btn-secondary"
        style={{ width: '100%', padding: '14px', color: 'var(--danger-crimson)', borderColor: 'var(--danger-border)', marginTop: '8px' }}
      >
        <LogOut size={16} />
        <span>Log Out of GasGuard</span>
      </button>
    </div>
  );
};
