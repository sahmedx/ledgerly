'use client';

import { VENDOR_SERIES, MONTH_LABELS, ACTUAL_THROUGH, fmtMoney } from '@/lib/data';
import { useOverrides, useTweaks } from '@/lib/contexts';

const TIMELINE_CATS = ['Cloud', 'SaaS', 'Marketing', 'Facilities'];

export default function VendorTimeline() {
  const { overrides } = useOverrides();
  const { tweaks } = useTweaks();

  return (
    <div style={{ flex: 1, overflow: 'auto' }} className="hide-scroll">
      {/* Sticky header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        borderBottom: '1px solid var(--line-softer)',
        background: '#fcfbf7',
        position: 'sticky',
        top: 0,
        zIndex: 2,
      }}>
        <div style={{
          padding: '6px 14px',
          fontSize: 11,
          color: 'var(--ink-3)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          borderRight: '1px solid var(--line-softer)',
        }}>
          Vendor · method
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(18, 1fr)' }}>
          {MONTH_LABELS.map((m, i) => (
            <div key={m} style={{
              padding: '6px 2px',
              fontSize: 10,
              textAlign: 'center',
              color: i <= ACTUAL_THROUGH ? 'var(--ink)' : 'var(--ink-3)',
              borderRight: '1px solid var(--line-softer)',
              background: i === ACTUAL_THROUGH ? '#fff4b8' : 'transparent',
            }}>
              {m.split(' ')[0]}<br />
              <span style={{ color: 'var(--ink-4)' }}>{m.split(' ')[1]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category groups */}
      {TIMELINE_CATS.map(cat => {
        const rows = VENDOR_SERIES.filter(v => v.cat === cat);
        if (rows.length === 0) return null;
        return (
          <div key={cat}>
            <div style={{
              padding: '8px 14px',
              fontSize: 11,
              background: '#f3f0e3',
              borderBottom: '1px solid var(--line-softer)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 700,
            }}>
              {cat} · {rows.length} vendor{rows.length !== 1 ? 's' : ''}
            </div>
            {rows.map(v => (
              <div
                key={v.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '240px 1fr',
                  borderBottom: '1px dashed var(--line-softer)',
                  alignItems: 'center',
                }}
              >
                <div style={{ padding: '8px 14px', borderRight: '1px solid var(--line-softer)' }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'var(--font-architects-daughter), cursive',
                  }}>
                    {v.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{v.method}</div>
                </div>
                <div style={{ position: 'relative', height: 46 }}>
                  <div className="sketch-box" style={{
                    position: 'absolute',
                    top: 6,
                    bottom: 6,
                    left: 0,
                    right: 0,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(18, 1fr)',
                    padding: 0,
                    background: '#fff',
                    overflow: 'hidden',
                  }}>
                    {v.series.map((s, i) => {
                      const val = overrides[v.name]?.[i] !== undefined ? overrides[v.name][i] : s.value;
                      const isOver = !s.isActual && v.variance === 'over';
                      const isUnder = !s.isActual && v.variance === 'good';
                      const cellClass = tweaks.varianceColor
                        ? isOver ? 'cell-over' : isUnder ? 'cell-under' : ''
                        : '';
                      return (
                        <div
                          key={i}
                          className={cellClass}
                          style={{
                            borderRight: i < 17 ? '1px dashed var(--line-softer)' : 'none',
                            padding: '2px 3px',
                            textAlign: 'center',
                            fontFamily: 'var(--font-jetbrains-mono), monospace',
                            fontSize: 10,
                            color: s.isActual ? 'var(--ink)' : 'var(--ink-3)',
                            fontWeight: s.isActual ? 700 : 400,
                            background: i === ACTUAL_THROUGH ? '#fff4b8' : undefined,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {fmtMoney(val, { compact: true })}
                        </div>
                      );
                    })}
                  </div>
                  {v.name === 'AWS' && tweaks.showAnnotations && (
                    <div className="note" style={{
                      position: 'absolute',
                      top: -8,
                      right: 10,
                      transform: 'rotate(3deg)',
                      fontSize: 13,
                    }}>
                      ↓ usage-based<br />spike in Q3
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
