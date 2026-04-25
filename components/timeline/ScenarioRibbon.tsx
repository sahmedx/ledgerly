'use client';

import { useState } from 'react';
import { VENDOR_SERIES } from '@/lib/data';
import Sparkline from '@/components/shared/Sparkline';

const SCENARIOS = [
  { name: 'Base', total: '$1.42M', note: 'Current plan' },
  { name: 'Belt-tight', total: '$1.28M', note: '-10% headcount' },
  { name: 'Growth', total: '$1.61M', note: '+Data team' },
];

export default function ScenarioRibbon() {
  const [activeIdx, setActiveIdx] = useState(0);
  const ribbonSeries = VENDOR_SERIES[0].series.slice(0, 14);

  return (
    <div style={{
      padding: '12px 18px',
      display: 'flex',
      gap: 10,
      borderBottom: '1.5px solid var(--line)',
      background: '#fcfbf7',
      flexShrink: 0,
    }}>
      {SCENARIOS.map((sc, i) => (
        <div
          key={sc.name}
          className="sketch-box"
          onClick={() => setActiveIdx(i)}
          style={{
            flex: 1,
            padding: '10px 14px',
            background: i === activeIdx ? '#fff4b8' : '#fff',
            boxShadow: i === activeIdx ? '2px 2px 0 var(--line)' : '1px 1px 0 var(--line)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 18, fontWeight: 700 }}>
              {sc.name}
            </div>
            <div style={{ marginLeft: 'auto' }} className="num">{sc.total}</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{sc.note}</div>
          <div style={{ marginTop: 6 }}>
            <Sparkline series={ribbonSeries} width={280} height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}
