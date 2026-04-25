'use client';

import { VENDOR_SERIES, ACTUAL_THROUGH, fmtMoney } from '@/lib/data';
import { useOverrides, useTweaks } from '@/lib/contexts';

function getVal(overrides: Record<string, Record<number, number>>, name: string, i: number, def: number): number {
  return overrides[name]?.[i] !== undefined ? overrides[name][i] : def;
}

function signedMoney(delta: number): string {
  const sign = delta >= 0 ? '+' : '-';
  return sign + fmtMoney(Math.abs(Math.round(delta)), { compact: true });
}

export default function KpiTiles() {
  const { overrides } = useOverrides();
  const { tweaks } = useTweaks();

  let mtdActual = 0, mtdBudget = 0;
  let ytdActual = 0, ytdBudget = 0;
  let fy26Actual = 0, fy26Budget = 0;

  for (const v of VENDOR_SERIES) {
    mtdActual += getVal(overrides, v.name, ACTUAL_THROUGH, v.series[ACTUAL_THROUGH].value);
    mtdBudget += v.series[ACTUAL_THROUGH].budget;

    for (let i = 0; i <= ACTUAL_THROUGH; i++) {
      ytdActual += getVal(overrides, v.name, i, v.series[i].value);
      ytdBudget += v.series[i].budget;
    }

    for (let i = 0; i < 12; i++) {
      fy26Actual += getVal(overrides, v.name, i, v.series[i].value);
      fy26Budget += v.series[i].budget;
    }
  }

  const mtdDelta = mtdActual - mtdBudget;
  const ytdDelta = ytdActual - ytdBudget;
  const fy26Pct = fy26Budget > 0 ? (fy26Actual - fy26Budget) / fy26Budget : 0;

  const tiles: Array<{ label: string; value: string; sub: string; tone: 'warn' | 'neutral' }> = [
    {
      label: 'MTD Actual',
      value: fmtMoney(Math.round(mtdActual), { compact: true }),
      sub: `${signedMoney(mtdDelta)} ${mtdDelta >= 0 ? 'over' : 'under'} plan`,
      tone: mtdDelta > 0 ? 'warn' : 'neutral',
    },
    {
      label: 'YTD Actual',
      value: fmtMoney(Math.round(ytdActual), { compact: true }),
      sub: `${signedMoney(ytdDelta)} ${ytdDelta >= 0 ? 'over' : 'under'} plan`,
      tone: ytdDelta > 0 ? 'warn' : 'neutral',
    },
    {
      label: 'FY26 Forecast',
      value: fmtMoney(Math.round(fy26Actual), { compact: true }),
      sub: `${fy26Pct >= 0 ? '+' : ''}${(fy26Pct * 100).toFixed(1)}% vs budget`,
      tone: fy26Pct > 0 ? 'warn' : 'neutral',
    },
    {
      label: 'Runway impact',
      value: '-$62k',
      sub: 'vs Jan plan',
      tone: 'neutral',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {tiles.map(({ label, value, sub, tone }) => (
        <div key={label} className="sketch-box" style={{ padding: '14px 16px', background: '#fff' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
            {label}
          </div>
          <div className="num" style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{value}</div>
          <div style={{
            fontSize: 12,
            marginTop: 2,
            color: tone === 'warn' && tweaks.varianceColor ? 'var(--accent-warn)' : 'var(--ink-3)',
          }}>
            {sub}
          </div>
        </div>
      ))}
    </div>
  );
}
