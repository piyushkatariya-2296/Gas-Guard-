import React from 'react';
import { Flame, ShieldCheck, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'radial-gradient(circle at center, #172138 0%, #0d131f 100%)',
        padding: '24px',
        textAlign: 'center'
      }}
    >
      {/* Flame Icon with Warm Glow */}
      <div
        style={{
          width: '92px',
          height: '92px',
          borderRadius: '26px',
          background: 'var(--brand-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--brand-glow)',
          marginBottom: '22px'
        }}
      >
        <Flame size={50} color="#ffffff" />
      </div>

      <h1
        style={{
          fontSize: '2.4rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: '#ffffff',
          marginBottom: '6px'
        }}
      >
        GasGuard
      </h1>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '36px', maxWidth: '260px' }}>
        Smart IoT Gas Leakage & Atmospheric Safety
      </p>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--safe-emerald)', fontSize: '0.8rem', background: 'var(--safe-bg)', padding: '6px 14px', borderRadius: '999px', border: '1px solid var(--safe-border)' }}>
        <ShieldCheck size={16} />
        <span>Hardware Safety Monitor Active</span>
      </div>
    </div>
  );
};
