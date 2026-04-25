'use client';

import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  onReset?: () => void;
  children: React.ReactNode;
}

export default function AssumptionsDrawer({ open, onClose, title, subtitle, onReset, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.08)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 160ms ease',
          zIndex: 9000,
        }}
      />
      {/* Panel */}
      <aside
        aria-hidden={!open}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 360,
          height: '100vh',
          background: 'var(--paper)',
          borderLeft: '1.5px solid var(--line)',
          boxShadow: '-2px 0 0 var(--line)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 200ms ease',
          zIndex: 9001,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{
          padding: '12px 16px',
          borderBottom: '1.5px solid var(--line)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          flexShrink: 0,
          background: '#fff',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="hand" style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
            {subtitle && (
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{subtitle}</div>
            )}
          </div>
          {onReset && (
            <button
              onClick={onReset}
              className="btn"
              style={{ fontSize: 11, padding: '3px 8px' }}
            >
              ↺ Reset
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              appearance: 'none',
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 16,
              color: 'var(--ink-3)',
              padding: '2px 4px',
              lineHeight: 1,
            }}
            aria-label="Close drawer"
          >✕</button>
        </div>
        <div style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          padding: '14px 16px 32px',
        }}>
          {children}
        </div>
      </aside>
    </>
  );
}

export function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--ink-4)',
        fontFamily: 'var(--font-architects-daughter), cursive',
        marginBottom: 8,
        paddingBottom: 4,
        borderBottom: '1px dashed var(--line-softer)',
      }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}
