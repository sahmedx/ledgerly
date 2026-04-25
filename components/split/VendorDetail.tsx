'use client';

import { MONTH_LABELS, ACTUAL_THROUGH, fmtMoney, fmtPct } from '@/lib/data';
import { useOverrides, useTweaks } from '@/lib/contexts';
import type { VendorSeries } from '@/lib/types';
import Sparkline2 from '@/components/shared/Sparkline2';

interface Props {
  vendor: VendorSeries;
}

const ACTIVITY = [
  { initials: 'JL', name: 'Jamie L.', time: '2h ago', msg: 'Pushed +4%/mo growth through Dec — usage trending up.' },
  { initials: 'RP', name: 'Riya P.', time: 'yesterday', msg: 'Contract renews Nov; flagged for renegotiation.' },
  { initials: '—', name: 'System', time: '3d ago', msg: 'Auto-synced Mar actual: $8,742 (+$240 vs fcst).' },
];

export default function VendorDetail({ vendor: v }: Props) {
  const { overrides } = useOverrides();
  const { tweaks } = useTweaks();

  const fy26Total = v.series.slice(0, 12).reduce((sum, s, i) => {
    const val = overrides[v.name]?.[i] !== undefined ? overrides[v.name][i] : s.value;
    return sum + val;
  }, 0);

  const ytdActuals = v.series.slice(0, ACTUAL_THROUGH + 1).reduce((sum, s, i) => {
    const val = overrides[v.name]?.[i] !== undefined ? overrides[v.name][i] : s.value;
    return sum + val;
  }, 0);

  const budgetYtd = v.series.slice(0, ACTUAL_THROUGH + 1).reduce((sum, s) => sum + s.budget, 0);
  const varianceDelta = ytdActuals - budgetYtd;
  const variancePct = budgetYtd > 0 ? varianceDelta / budgetYtd : 0;
  const curMonthDelta = v.series[ACTUAL_THROUGH].value - v.series[ACTUAL_THROUGH].budget;

  const kpiTiles = [
    { label: 'FY26 total', value: fmtMoney(fy26Total, { compact: true }), sub: '+5.2% YoY' },
    { label: 'YTD actuals', value: fmtMoney(ytdActuals, { compact: true }), sub: `Apr ${curMonthDelta >= 0 ? '+' : ''}${fmtMoney(Math.round(curMonthDelta), { compact: true })}` },
    { label: 'Variance to budget', value: `${varianceDelta >= 0 ? '+' : ''}${fmtMoney(Math.abs(varianceDelta), { compact: true })}`, sub: `${varianceDelta >= 0 ? 'over' : 'under'} by ${Math.abs(variancePct * 100).toFixed(1)}%` },
    { label: 'Contract end', value: "Nov 12 '26", sub: '6 months out' },
  ];

  return (
    <div
      style={{ flex: 1, minWidth: 0, overflow: 'auto', padding: '16px 20px', background: 'var(--paper)' }}
      className="hide-scroll"
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
            {v.name}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
            {v.cat} · GL {v.gl} · Owner: {v.owner} · Method: <u>{v.method}</u>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <div className="btn">Add note</div>
          <div className="btn">Renew contract</div>
          <div className="btn btn-primary">Reforecast</div>
        </div>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
        {kpiTiles.map(({ label, value, sub }) => (
          <div key={label} className="sketch-box" style={{ padding: '10px 12px', background: '#fff' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </div>
            <div className="num" style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Forecast chart */}
      <div className="sketch-box" style={{ marginTop: 12, padding: '12px 14px', background: '#fff', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
          <div style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 18, fontWeight: 700 }}>
            Forecast · next 18 months
          </div>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>— actual &nbsp; - - forecast</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {['Flat', '+2%/mo', '+4%/mo', 'Manual'].map((m, i) => (
              <div key={m} style={{
                fontSize: 11,
                padding: '2px 8px',
                border: '1px solid var(--line-soft)',
                background: i === 2 ? '#fff4b8' : '#fff',
                fontWeight: i === 2 ? 700 : 400,
              }}>
                {m}
              </div>
            ))}
          </div>
        </div>
        <div style={{ overflow: 'hidden' }}>
          <Sparkline2 series={v.series} width={760} height={120} />
        </div>
        {tweaks.showAnnotations && (
          <div className="note" style={{ position: 'absolute', top: 44, right: 36, width: 160, transform: 'rotate(3deg)' }}>
            forecast = baseline ×<br />
            (1 + 4%)^n · edit per-cell
          </div>
        )}
      </div>

      {/* Monthly override strip */}
      <div className="sketch-box" style={{ marginTop: 12, background: '#fff' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--line-softer)', fontSize: 13, fontWeight: 700 }}>
          Monthly override
        </div>
        <div style={{ overflowX: 'auto' }} className="hide-scroll">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(18, minmax(52px, 1fr))', minWidth: 936 }}>
            {MONTH_LABELS.map((m, i) => {
              const s = v.series[i];
              const val = overrides[v.name]?.[i] !== undefined ? overrides[v.name][i] : s.value;
              const isOverride = overrides[v.name]?.[i] !== undefined;
              const isCurrent = i === ACTUAL_THROUGH;
              return (
                <div key={m} style={{
                  padding: '8px 4px',
                  borderRight: '1px solid var(--line-softer)',
                  borderBottom: '1px solid var(--line-softer)',
                  background: isCurrent ? '#fff4b8' : s.isActual ? '#fcfbf7' : '#fff',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>{s.isActual ? 'ACT' : 'FCST'}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{m.split(' ')[0]}</div>
                  <div className="num" style={{ fontSize: 13, fontWeight: s.isActual ? 700 : 500, marginTop: 4 }}>
                    {fmtMoney(val, { compact: true })}
                    {isOverride && <span style={{ fontSize: 8, color: 'var(--ink-3)', marginLeft: 2 }}>●</span>}
                  </div>
                  {!s.isActual && (
                    <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 2 }}>
                      {fmtPct((val - v.series[ACTUAL_THROUGH].value) / v.series[ACTUAL_THROUGH].value)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity feed */}
      <div className="sketch-box" style={{ marginTop: 12, background: '#fff', padding: '10px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Activity</div>
        {ACTIVITY.map(({ initials, name, time, msg }) => (
          <div key={time} style={{
            display: 'flex',
            gap: 10,
            padding: '6px 0',
            borderTop: '1px dashed var(--line-softer)',
            fontSize: 12,
          }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              border: '1.2px solid var(--line)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 10,
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <div><b>{name}</b> · <span style={{ color: 'var(--ink-3)' }}>{time}</span></div>
              <div style={{ color: 'var(--ink-2)' }}>{msg}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
