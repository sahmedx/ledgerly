'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTweaks } from '@/lib/contexts';
import type { Tweaks } from '@/lib/types';

export default function TweaksPanel() {
  const { tweaks, setTweaks } = useTweaks();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ right: 16, bottom: 16 });
  const panelRef = useRef<HTMLDivElement>(null);

  const clamp = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const PAD = 16;
    setPos(prev => ({
      right:  Math.min(Math.max(PAD, prev.right),  Math.max(PAD, window.innerWidth  - w - PAD)),
      bottom: Math.min(Math.max(PAD, prev.bottom), Math.max(PAD, window.innerHeight - h - PAD)),
    }));
  }, []);

  useEffect(() => {
    if (open) clamp();
  }, [open, clamp]);

  const onDragStart = (e: React.MouseEvent) => {
    const panel = panelRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startRight  = window.innerWidth  - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = (ev: MouseEvent) => {
      const PAD = 16;
      setPos({
        right:  Math.max(PAD, startRight  - (ev.clientX - sx)),
        bottom: Math.max(PAD, startBottom - (ev.clientY - sy)),
      });
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const densityOptions: Tweaks['density'][] = ['compact', 'regular', 'comfy'];
  const timeOptions: { value: Tweaks['timeUnit']; label: string }[] = [
    { value: 'monthly',   label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
  ];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 9999,
          appearance: 'none',
          border: '1.5px solid var(--line)',
          background: '#fff',
          boxShadow: '1px 1px 0 var(--line)',
          padding: '6px 12px',
          fontFamily: 'var(--font-architects-daughter), cursive',
          fontSize: 13,
          cursor: 'pointer',
          color: 'var(--ink-2)',
        }}
      >
        ⚙ Tweaks
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        right: pos.right,
        bottom: pos.bottom,
        zIndex: 9999,
        width: 260,
        background: 'rgba(250,249,247,0.92)',
        border: '1.5px solid var(--line)',
        boxShadow: '2px 2px 0 var(--line)',
        fontFamily: 'var(--font-architects-daughter), cursive',
        fontSize: 13,
      }}
    >
      {/* Header */}
      <div
        onMouseDown={onDragStart}
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--line-softer)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'move',
          userSelect: 'none',
        }}
      >
        <span style={{ fontWeight: 700 }}>Tweaks</span>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setOpen(false)}
          style={{
            appearance: 'none',
            border: 0,
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 13,
            color: 'var(--ink-3)',
            padding: '2px 4px',
          }}
        >✕</button>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Density */}
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: 6 }}>
            Row density
          </div>
          <div style={{ display: 'flex', gap: 0, border: '1px solid var(--line-soft)' }}>
            {densityOptions.map((d) => (
              <button
                key={d}
                onClick={() => setTweaks({ density: d })}
                style={{
                  flex: 1,
                  appearance: 'none',
                  border: 0,
                  borderRight: d !== 'comfy' ? '1px solid var(--line-soft)' : 'none',
                  padding: '5px 0',
                  background: tweaks.density === d ? '#fff4b8' : 'transparent',
                  fontFamily: 'var(--font-architects-daughter), cursive',
                  fontSize: 12,
                  fontWeight: tweaks.density === d ? 700 : 400,
                  cursor: 'pointer',
                  color: 'var(--ink-2)',
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Variance color */}
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
          <span>Variance color</span>
          <input
            type="checkbox"
            checked={tweaks.varianceColor}
            onChange={(e) => setTweaks({ varianceColor: e.target.checked })}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
        </label>

        {/* Annotations */}
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
          <span>Show annotations</span>
          <input
            type="checkbox"
            checked={tweaks.showAnnotations}
            onChange={(e) => setTweaks({ showAnnotations: e.target.checked })}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
        </label>

        {/* Time unit */}
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: 6 }}>
            Time unit
          </div>
          <div style={{ display: 'flex', gap: 0, border: '1px solid var(--line-soft)' }}>
            {timeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTweaks({ timeUnit: opt.value })}
                style={{
                  flex: 1,
                  appearance: 'none',
                  border: 0,
                  borderRight: opt.value === 'monthly' ? '1px solid var(--line-soft)' : 'none',
                  padding: '5px 0',
                  background: tweaks.timeUnit === opt.value ? '#fff4b8' : 'transparent',
                  fontFamily: 'var(--font-architects-daughter), cursive',
                  fontSize: 12,
                  fontWeight: tweaks.timeUnit === opt.value ? 700 : 400,
                  cursor: 'pointer',
                  color: 'var(--ink-2)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
