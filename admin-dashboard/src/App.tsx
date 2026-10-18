import React, { useState } from 'react';
import { 
  Flame, 
  Users, 
  Cpu, 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  Search, 
  Wifi, 
  WifiOff, 
  Bell, 
  RefreshCw, 
  Sliders, 
  VolumeX, 
  Power, 
  X, 
  Download, 
  CheckCircle2, 
  Radio 
} from 'lucide-react';

interface DeviceItem {
  deviceId: string;
  name: string;
  ownerEmail: string;
  status: 'SAFE' | 'WARNING' | 'GAS_DETECTED' | 'OFFLINE';
  firmwareVersion: string;
  wifiRssi: number;
  lastSeen: string;
  currentPpm?: number;
}

export const App: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedDevice, setSelectedDevice] = useState<DeviceItem | null>(null);
  const [actionNotice, setActionNotice] = useState<string>('');
  const [isPinging, setIsPinging] = useState(false);

  const [stats, setStats] = useState({
    totalUsers: 142,
    totalDevices: 86,
    onlineDevices: 74,
    offlineDevices: 12,
    warningDevices: 3,
    criticalDevices: 1
  });

  const [devices, setDevices] = useState<DeviceItem[]>([
    {
      deviceId: 'GG-000001',
      name: 'Piyush Main Kitchen',
      ownerEmail: 'piyush@gasguard.io',
      status: 'SAFE',
      firmwareVersion: '1.0.0',
      wifiRssi: -54,
      lastSeen: new Date().toISOString(),
      currentPpm: 240
    },
    {
      deviceId: 'GG-000002',
      name: 'Retail Shop Area',
      ownerEmail: 'piyush@gasguard.io',
      status: 'WARNING',
      firmwareVersion: '1.0.0',
      wifiRssi: -68,
      lastSeen: new Date(Date.now() - 45000).toISOString(),
      currentPpm: 840
    },
    {
      deviceId: 'GG-000003',
      name: 'Factory Workshop 4',
      ownerEmail: 'manager@factory.com',
      status: 'GAS_DETECTED',
      firmwareVersion: '1.0.0',
      wifiRssi: -48,
      lastSeen: new Date().toISOString(),
      currentPpm: 1720
    },
    {
      deviceId: 'GG-000004',
      name: 'Bakery Oven Detector',
      ownerEmail: 'owner@bakery.org',
      status: 'OFFLINE',
      firmwareVersion: '1.0.0',
      wifiRssi: -82,
      lastSeen: new Date(Date.now() - 7200000).toISOString(),
      currentPpm: 0
    }
  ]);

  const filteredDevices = devices.filter((d) => {
    const matchesSearch =
      d.deviceId.toLowerCase().includes(search.toLowerCase()) ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.ownerEmail.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filterStatus === 'ALL' || d.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleRemoteCommand = (command: string, deviceId: string) => {
    setActionNotice(`Transmitted MQTT command: '${command}' to topic 'gasguard/${deviceId}/command'`);
    setTimeout(() => setActionNotice(''), 4000);
  };

  const handlePingFleet = () => {
    setIsPinging(true);
    setTimeout(() => {
      setIsPinging(false);
      setActionNotice('Heartbeat ping broadcasted to all 86 devices across MQTT broker.');
      setTimeout(() => setActionNotice(''), 3500);
    }, 1200);
  };

  const exportCsv = () => {
    const headers = 'Device ID,Name,Owner Email,Status,RSSI,Firmware,Last Seen\n';
    const rows = filteredDevices
      .map((d) => `${d.deviceId},"${d.name}",${d.ownerEmail},${d.status},${d.wifiRssi},v${d.firmwareVersion},${d.lastSeen}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gasguard_fleet_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header
        style={{
          background: 'rgba(20, 27, 45, 0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-color)',
          padding: '16px 36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'var(--brand-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--brand-glow)'
            }}
          >
            <Flame size={26} color="white" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              GASGUARD FLEET OPERATIONS
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Hardware Fleet Management, Remote MQTT Commands & Telemetry
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={handlePingFleet} disabled={isPinging} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
            <Radio size={15} color="var(--brand-primary)" className={isPinging ? 'spin' : ''} />
            <span>{isPinging ? 'Pinging Fleet...' : 'Ping Liveness'}</span>
          </button>

          <button onClick={exportCsv} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <span style={{ fontSize: '0.82rem', color: 'var(--safe-green)', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--safe-bg)', padding: '6px 12px', borderRadius: '999px', border: '1px solid var(--safe-border)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} />
            Broker & Cloud System Normal
          </span>
        </div>
      </header>

      {/* Action Notice Toast */}
      {actionNotice && (
        <div style={{ background: 'var(--brand-gradient)', color: 'white', padding: '10px 24px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: 'var(--brand-glow)' }}>
          <CheckCircle2 size={16} />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Content Layout */}
      <main style={{ padding: '32px 36px', flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* KPI Metrics Dashboard Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
          <div
            onClick={() => setFilterStatus('ALL')}
            className={`admin-card interactive ${filterStatus === 'ALL' ? 'active-filter' : ''}`}
            style={{ cursor: 'pointer', border: filterStatus === 'ALL' ? '1px solid var(--brand-primary)' : '1px solid var(--border-color)' }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Fleet</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.02em' }}>{stats.totalDevices}</div>
          </div>

          <div
            onClick={() => setFilterStatus('ALL')}
            className="admin-card"
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Active Users</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.02em' }}>{stats.totalUsers}</div>
          </div>

          <div
            onClick={() => setFilterStatus('SAFE')}
            className="admin-card interactive"
            style={{ cursor: 'pointer', border: filterStatus === 'SAFE' ? '1px solid var(--safe-green)' : '1px solid var(--border-color)' }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--safe-green)', textTransform: 'uppercase', fontWeight: 700 }}>Online Safe</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--safe-green)', marginTop: '4px', letterSpacing: '-0.02em' }}>{stats.onlineDevices}</div>
          </div>

          <div
            onClick={() => setFilterStatus('WARNING')}
            className="admin-card interactive"
            style={{ cursor: 'pointer', border: filterStatus === 'WARNING' ? '1px solid var(--warning-yellow)' : '1px solid var(--border-color)' }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--warning-yellow)', textTransform: 'uppercase', fontWeight: 700 }}>Elevated Warning</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning-yellow)', marginTop: '4px', letterSpacing: '-0.02em' }}>{stats.warningDevices}</div>
          </div>

          <div
            onClick={() => setFilterStatus('GAS_DETECTED')}
            className="admin-card interactive"
            style={{ cursor: 'pointer', border: filterStatus === 'GAS_DETECTED' ? '1px solid var(--danger-red)' : '1px solid var(--border-color)' }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--danger-red)', textTransform: 'uppercase', fontWeight: 700 }}>Critical Leak</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger-red)', marginTop: '4px', letterSpacing: '-0.02em' }}>{stats.criticalDevices}</div>
          </div>

          <div
            onClick={() => setFilterStatus('OFFLINE')}
            className="admin-card interactive"
            style={{ cursor: 'pointer', border: filterStatus === 'OFFLINE' ? '1px solid var(--offline-gray)' : '1px solid var(--border-color)' }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--offline-gray)', textTransform: 'uppercase', fontWeight: 700 }}>Offline</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--offline-gray)', marginTop: '4px', letterSpacing: '-0.02em' }}>{stats.offlineDevices}</div>
          </div>
        </div>

        {/* Device Fleet Search & Filter Section */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', fontWeight: 800 }}>
                Registered Hardware Fleet ({filteredDevices.length})
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Click any device to open remote MQTT controls & live telemetry inspector
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={18} color="var(--text-subtle)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
                <input
                  type="text"
                  placeholder="Search Device ID, Room, or Owner..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-card-elevated)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '10px 14px 10px 42px',
                    color: 'white',
                    outline: 'none',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Fleet Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '14px 16px' }}>Hardware ID</th>
                  <th style={{ padding: '14px 16px' }}>Label / Facility</th>
                  <th style={{ padding: '14px 16px' }}>Owner Account</th>
                  <th style={{ padding: '14px 16px' }}>Current Status</th>
                  <th style={{ padding: '14px 16px' }}>Gas Level</th>
                  <th style={{ padding: '14px 16px' }}>Signal (RSSI)</th>
                  <th style={{ padding: '14px 16px' }}>Firmware</th>
                  <th style={{ padding: '14px 16px' }}>Last Heartbeat</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((d) => (
                  <tr
                    key={d.deviceId}
                    onClick={() => setSelectedDevice(d)}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '16px', fontWeight: 800, color: 'var(--brand-primary)' }}>
                      {d.deviceId}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 700 }}>{d.name}</td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{d.ownerEmail}</td>
                    <td style={{ padding: '16px' }}>
                      <span
                        className={
                          d.status === 'GAS_DETECTED'
                            ? 'badge badge-critical'
                            : d.status === 'WARNING'
                            ? 'badge badge-warning'
                            : d.status === 'OFFLINE'
                            ? 'badge badge-offline'
                            : 'badge badge-safe'
                        }
                      >
                        {d.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 700 }}>
                      {d.status === 'OFFLINE' ? (
                        <span style={{ color: 'var(--text-subtle)' }}>N/A</span>
                      ) : (
                        <span>{d.currentPpm || 240} PPM</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                      {d.wifiRssi} dBm
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>v{d.firmwareVersion}</td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                      {new Date(d.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Remote MQTT Hardware Management Drawer / Modal */}
      {selectedDevice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 999
          }}
        >
          <div
            className="admin-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '28px',
              border: '1px solid var(--border-strong)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 800 }}>
                  ESP32 HARDWARE CONTROLLER
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '2px' }}>
                  {selectedDevice.name} ({selectedDevice.deviceId})
                </h3>
              </div>
              <button
                onClick={() => setSelectedDevice(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Quick Specs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: 'var(--bg-card-elevated)', padding: '14px', borderRadius: '14px', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--text-subtle)', display: 'block' }}>Status</span>
                <span style={{ fontWeight: 800 }}>{selectedDevice.status}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-subtle)', display: 'block' }}>Wi-Fi RSSI</span>
                <span style={{ fontWeight: 800 }}>{selectedDevice.wifiRssi} dBm</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-subtle)', display: 'block' }}>Firmware</span>
                <span style={{ fontWeight: 800 }}>v{selectedDevice.firmwareVersion}</span>
              </div>
            </div>

            {/* Remote Commands Section */}
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '12px' }}>
                Remote MQTT Commands (Backend → ESP32)
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => handleRemoteCommand('SILENCE_BUZZER', selectedDevice.deviceId)}
                  className="btn-secondary"
                  style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
                >
                  <VolumeX size={18} color="var(--warning-yellow)" />
                  <div>
                    <span style={{ display: 'block', textAlign: 'left', fontWeight: 700 }}>Silence Buzzer Alarm (60s)</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mutes local physical buzzer for 60 seconds</span>
                  </div>
                </button>

                <button
                  onClick={() => handleRemoteCommand('SET_THRESHOLD (1000/1500)', selectedDevice.deviceId)}
                  className="btn-secondary"
                  style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
                >
                  <Sliders size={18} color="var(--brand-primary)" />
                  <div>
                    <span style={{ display: 'block', textAlign: 'left', fontWeight: 700 }}>Push Standard Safety Thresholds</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sets Warning to 1000 ADC and Critical to 1500 ADC</span>
                  </div>
                </button>

                <button
                  onClick={() => handleRemoteCommand('REBOOT', selectedDevice.deviceId)}
                  className="btn-secondary"
                  style={{ justifyContent: 'flex-start', padding: '12px 16px', color: 'var(--danger-red)', borderColor: 'var(--danger-border)' }}
                >
                  <Power size={18} color="var(--danger-red)" />
                  <div>
                    <span style={{ display: 'block', textAlign: 'left', fontWeight: 700 }}>Reboot ESP32 Device</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Initiates hardware soft restart over MQTT command channel</span>
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={() => setSelectedDevice(null)}
              className="btn-primary"
              style={{ padding: '12px', width: '100%', justifyContent: 'center' }}
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
