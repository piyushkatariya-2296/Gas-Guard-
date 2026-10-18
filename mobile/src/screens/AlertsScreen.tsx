import React from 'react';
import { Bell, AlertTriangle, ShieldCheck, CheckCircle2, WifiOff, Flame, PhoneCall } from 'lucide-react';
import { Alert } from '../types';
import { api } from '../services/api';
import { soundMgr } from '../services/soundManager';

interface AlertsScreenProps {
  alerts: Alert[];
  onAcknowledgeAlert: (alertId: string) => void;
  onEmergencyCall?: () => void;
}

export const AlertsScreen: React.FC<AlertsScreenProps> = ({ alerts, onAcknowledgeAlert, onEmergencyCall }) => {
  const handleAck = async (id: string) => {
    soundMgr.playTap();
    try {
      await api.acknowledgeAlert(id);
    } catch (err) {}
    onAcknowledgeAlert(id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Safety Alerts</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Real-time Gas Warnings & Safety Events
          </p>
        </div>

        {alerts.some((a) => !a.acknowledged) && onEmergencyCall && (
          <button onClick={onEmergencyCall} className="btn-emergency" style={{ padding: '8px 14px', fontSize: '0.78rem' }}>
            <PhoneCall size={14} />
            <span>SOS</span>
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="human-card" style={{ textAlign: 'center', padding: '48px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--safe-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={36} color="var(--safe-emerald)" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--safe-emerald)' }}>Atmosphere is Clean</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '260px', lineHeight: 1.5 }}>
            No hazardous gas leaks detected. All sensors are running normally.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.map((alert) => {
            const isCritical = alert.status === 'GAS_DETECTED';
            const isWarning = alert.status === 'WARNING';
            const isOffline = alert.status === 'OFFLINE';

            return (
              <div
                key={alert._id}
                className="human-card"
                style={{
                  borderLeft: `4px solid ${
                    isCritical
                      ? 'var(--danger-crimson)'
                      : isWarning
                      ? 'var(--warning-amber)'
                      : isOffline
                      ? 'var(--offline-slate)'
                      : 'var(--safe-emerald)'
                  }`,
                  opacity: alert.acknowledged ? 0.65 : 1
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span
                    className={`status-pill ${
                      isCritical ? 'critical' : isWarning ? 'warning' : isOffline ? 'offline' : 'safe'
                    }`}
                  >
                    {isCritical ? 'CRITICAL LEAK' : alert.status}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', margin: '8px 0' }}>
                  {alert.message}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Device: <strong>{alert.deviceId}</strong>
                  </span>

                  {!alert.acknowledged ? (
                    <button
                      onClick={() => handleAck(alert._id)}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      <CheckCircle2 size={14} color="var(--safe-emerald)" />
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--safe-emerald)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} />
                      <span>Acknowledged</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Safety Protocol Reminder Card */}
      <div className="human-card" style={{ background: 'var(--bg-surface-elevated)' }}>
        <h4 style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={16} color="var(--warning-amber)" />
          <span>Quick Safety Guide</span>
        </h4>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          If an alarm sounds: immediately close the gas cylinder valve, extinguish all naked flames, avoid operating any electrical switches, and open all windows for natural ventilation.
        </p>
      </div>
    </div>
  );
};
