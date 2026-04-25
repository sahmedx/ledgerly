'use client';

import { useState } from 'react';

const METHODS = [
  'Flat run-rate',
  'Growth % · baseline',
  'Contract schedule',
  'Driver: seats × price',
  'Manual entry',
];

function vendorMethodToPopover(m: string): string {
  if (m.includes('Usage') || m.includes('Budget')) return 'Growth % · baseline';
  if (m.includes('Contract')) return 'Contract schedule';
  if (m.includes('Seat')) return 'Driver: seats × price';
  return 'Flat run-rate';
}

interface Props {
  vendorMethod: string;
  growth: number;
  onClose: () => void;
}

export default function ForecastPopover({ vendorMethod, growth, onClose }: Props) {
  const [active, setActive] = useState(() => vendorMethodToPopover(vendorMethod));
  const rate = (growth * 100).toFixed(1);

  return (
    <div className="sketch-box" style={{
      width: 240, padding: 10, background: '#fff',
      fontFamily: 'var(--font-architects-daughter), cursive',
      fontSize: 12,
    }}>
      <div style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
        Forecast method
      </div>
      {METHODS.map(m => (
        <div
          key={m}
          onClick={() => setActive(m)}
          style={{
            padding: '5px 8px', marginBottom: 2, cursor: 'pointer',
            background: m === active ? '#fff4b8' : 'transparent',
            border: m === active ? '1.2px solid var(--line)' : '1.2px solid transparent',
          }}
        >
          {m === active ? '● ' : '○ '}{m}
        </div>
      ))}
      <div style={{ borderTop: '1px dashed var(--line-soft)', margin: '8px 0 6px' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>Growth</span>
        <div className="sketch-box" style={{ padding: '1px 6px' }}>+{rate}%</div>
        <span>/ month</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, gap: 6 }}>
        <button className="btn" style={{ fontSize: 11, padding: '2px 8px' }} onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={onClose}>
          Apply to row
        </button>
      </div>
    </div>
  );
}
