import React from 'react';
import { Home, Cpu, Activity, History, Bell, Settings } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  alertBadgeCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, alertBadgeCount }) => {
  const navItems: { tab: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'home', label: 'Safety', icon: <Home size={20} strokeWidth={activeTab === 'home' ? 2.5 : 2} /> },
    { tab: 'devices', label: 'Detectors', icon: <Cpu size={20} strokeWidth={activeTab === 'devices' ? 2.5 : 2} /> },
    { tab: 'live', label: 'Live Wave', icon: <Activity size={20} strokeWidth={activeTab === 'live' ? 2.5 : 2} /> },
    { tab: 'history', label: 'Timeline', icon: <History size={20} strokeWidth={activeTab === 'history' ? 2.5 : 2} /> },
    {
      tab: 'alerts',
      label: 'Alerts',
      icon: (
        <div style={{ position: 'relative' }}>
          <Bell size={20} strokeWidth={activeTab === 'alerts' ? 2.5 : 2} />
          {alertBadgeCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-6px',
                background: 'var(--danger-crimson)',
                color: 'white',
                fontSize: '0.62rem',
                fontWeight: 800,
                minWidth: '16px',
                height: '16px',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                boxShadow: '0 2px 6px rgba(244, 63, 94, 0.5)'
              }}
            >
              {alertBadgeCount}
            </span>
          )}
        </div>
      )
    },
    { tab: 'settings', label: 'Settings', icon: <Settings size={20} strokeWidth={activeTab === 'settings' ? 2.5 : 2} /> }
  ];

  return (
    <nav className="bottom-nav-bar">
      {navItems.map((item) => (
        <button
          key={item.tab}
          onClick={() => onTabChange(item.tab)}
          className={`nav-tab-button ${activeTab === item.tab ? 'active' : ''}`}
          aria-label={item.label}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
