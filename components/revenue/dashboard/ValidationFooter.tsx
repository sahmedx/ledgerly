'use client';

import { useState } from 'react';
import { useRevenue } from '@/lib/revenue/contexts';

/** Soft (warning-only) check IDs — failures render yellow, do not flip the headline status. */
const SOFT_CHECKS = new Set(['sbc_calibration']);

export default function ValidationFooter() {
  const { results, activeScenario } = useRevenue();
  const [open, setOpen] = useState(false);
  const r = results[activeScenario];
  const checks = r.validations;
  const passing = checks.filter(c => c.passed).length;
  const hardFailing = checks.filter(c => !c.passed && !SOFT_CHECKS.has(c.id)).length;
  const allHardPass = hardFailing === 0;

  return (
    <div className="sketch-box" style={{ padding: '8px 14px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer',
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: 0,
          fontFamily: 'var(--font-architects-daughter), cursive',
        }}>
        <span style={{
          width: 10, height: 10, borderRadius: 5,
          background: allHardPass ? 'var(--accent-good)' : 'var(--accent-warn)',
          display: 'inline-block',
        }} />
        <span style={{ fontSize: 13, fontWeight: 700 }}>
          Model integrity · {passing}/{checks.length} checks passing
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
          {open ? '▴ collapse' : '▾ expand'}
        </span>
      </button>
      {open && (
        <div style={{
          marginTop: 8,
          paddingTop: 8,
          borderTop: '1px dashed var(--line-soft)',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 6,
        }}>
          {checks.map(c => {
            const soft = SOFT_CHECKS.has(c.id);
            const dotColor = c.passed
              ? 'var(--accent-good)'
              : soft
                ? '#d4a017'  // yellow for warnings (calibration drift)
                : 'var(--accent-warn)';
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 12 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: 4,
                  background: dotColor,
                  display: 'inline-block',
                  flexShrink: 0,
                }} />
                <span style={{ color: 'var(--ink-2)' }}>
                  {c.label}
                  {soft && !c.passed && <span style={{ color: '#d4a017', marginLeft: 6 }}>· warn</span>}
                </span>
                <span className="num" style={{ color: 'var(--ink-4)', fontSize: 11 }}>{c.detail}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
