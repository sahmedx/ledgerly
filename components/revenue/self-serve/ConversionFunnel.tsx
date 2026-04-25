'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtCount } from '@/lib/revenue/format';

const END_IDX = 17; // Jun 27

export default function ConversionFunnel() {
  const { results, activeScenario } = useRevenue();
  const r = results[activeScenario];
  const m = r.monthly[END_IDX];

  // 18-month average conversions/month
  const avgNew = r.monthly.reduce((s, x) => s + x.self_serve.new_paid_workspaces, 0) / r.monthly.length;

  const stages = [
    {
      label: 'Free user pool',
      value: m.self_serve.free_users,
      sub: 'end of forecast',
    },
    {
      label: 'New paid /mo',
      value: avgNew,
      sub: '18-mo avg',
    },
    {
      label: 'Active workspaces',
      value: m.self_serve.active_workspaces.plus + m.self_serve.active_workspaces.business_small,
      breakdown: [
        { k: 'Plus',     v: m.self_serve.active_workspaces.plus },
        { k: 'Business', v: m.self_serve.active_workspaces.business_small },
      ],
    },
    {
      label: 'Active seats',
      value: m.self_serve.active_seats.plus + m.self_serve.active_seats.business_small,
      breakdown: [
        { k: 'Plus',     v: m.self_serve.active_seats.plus },
        { k: 'Business', v: m.self_serve.active_seats.business_small },
      ],
    },
  ];

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div className="hand" style={{ fontSize: 18, marginBottom: 10 }}>
        Conversion funnel · {m.calendar_label}
      </div>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 6 }}>
        {stages.map((s, i) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <div style={{
              flex: 1,
              minWidth: 0,
              border: '1.5px solid var(--line)',
              background: '#fff',
              padding: '10px 12px',
              boxShadow: '1px 1px 0 var(--line)',
            }}>
              <div style={{
                fontSize: 10,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink-4)',
                fontFamily: 'var(--font-architects-daughter), cursive',
                marginBottom: 4,
              }}>{s.label}</div>
              <div className="num" style={{
                fontSize: 20,
                fontWeight: 600,
                color: 'var(--ink)',
              }}>{fmtCount(s.value)}</div>
              {s.sub && (
                <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{s.sub}</div>
              )}
              {s.breakdown && (
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {s.breakdown.map(b => (
                    <div key={b.k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: 'var(--ink-3)' }}>{b.k}</span>
                      <span className="num" style={{ color: 'var(--ink-2)' }}>{fmtCount(b.v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {i < stages.length - 1 && (
              <div style={{
                width: 18,
                display: 'grid',
                placeItems: 'center',
                color: 'var(--ink-4)',
                fontFamily: 'var(--font-architects-daughter), cursive',
                fontSize: 18,
              }}>→</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
