'use client';

import { useState } from 'react';
import { VENDOR_SERIES, ACTUAL_THROUGH, fmtMoney } from '@/lib/data';
import { useTweaks } from '@/lib/contexts';
import Sparkline from '@/components/shared/Sparkline';
import VarianceBadge from '@/components/shared/VarianceBadge';

interface Props {
  selectedIdx: number;
  onSelect: (idx: number) => void;
}

const overCount = VENDOR_SERIES.filter(v => v.variance === 'over').length;

export default function VendorList({ selectedIdx, onSelect }: Props) {
  const { tweaks } = useTweaks();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVendors = searchQuery.trim()
    ? VENDOR_SERIES.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : VENDOR_SERIES;

  return (
    <div style={{
      width: 320,
      borderRight: '1.5px solid var(--line-softer)',
      display: 'flex',
      flexDirection: 'column',
      background: '#fff',
      flexShrink: 0,
    }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line-softer)' }}>
        <div className="sketch-box" style={{ padding: '4px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--ink-4)' }}>🔍</span>
          <input
            type="text"
            placeholder="Search vendors…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-architects-daughter), cursive',
              fontSize: 12,
              color: 'var(--ink)',
              width: '100%',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {[`All ${filteredVendors.length}`, `Over ${overCount}`, 'Renew 3'].map((c, i) => (
            <div key={c} style={{
              fontSize: 11,
              padding: '2px 8px',
              border: '1px solid var(--line-soft)',
              background: i === 0 ? '#fff4b8' : '#fff',
              fontWeight: i === 0 ? 700 : 400,
            }}>
              {c}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }} className="hide-scroll">
        {filteredVendors.map((v) => {
          const originalIdx = VENDOR_SERIES.findIndex(s => s.name === v.name);
          const isSelected = originalIdx === selectedIdx;
          return (
          <div
            key={v.name}
            onClick={() => onSelect(originalIdx)}
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--line-softer)',
              background: isSelected ? '#fff4b8' : 'transparent',
              borderLeft: isSelected ? '3px solid var(--ink)' : '3px solid transparent',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: 'var(--font-architects-daughter), cursive',
                fontSize: 14,
                fontWeight: isSelected ? 700 : 500,
              }}>
                {v.name}
              </span>
              <span style={{ marginLeft: 'auto' }}>
                {tweaks.varianceColor && <VarianceBadge variance={v.variance} />}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{v.cat} · GL {v.gl}</span>
              <span style={{ marginLeft: 'auto' }} className="num">
                {fmtMoney(v.series[ACTUAL_THROUGH].value, { compact: true })}/mo
              </span>
            </div>
            <div style={{ marginTop: 4 }}>
              <Sparkline series={v.series.slice(0, 14)} width={280} height={14} />
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
