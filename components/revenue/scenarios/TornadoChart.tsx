'use client';

import { useMemo } from 'react';
import { useRevenue } from '@/lib/revenue/contexts';
import { simulate } from '@/lib/revenue/engine';
import { fmtMoneyScaled, fmtPctScaled } from '@/lib/revenue/format';
import type { Assumptions } from '@/lib/revenue/types';
import LegendSwatch from '../shared/LegendSwatch';

interface DriverSpec {
  path: string;
  label: string;
}

const DRIVERS: DriverSpec[] = [
  { path: 'self_serve.free_pool_monthly_growth',                            label: 'Free user growth /mo' },
  { path: 'self_serve.free_to_paid_rate',                                   label: 'Free → paid conversion' },
  { path: 'self_serve.plus_to_business_upgrade_rate',                       label: 'Plus → Business upgrade' },
  { path: 'self_serve.monthly_seat_growth_rate.business_small',             label: 'Seat growth · Business' },
  { path: 'self_serve.retention.plus.decay',                                label: 'Retention decay · Plus' },
  { path: 'sales_led.win_rate',                                             label: 'Win rate' },
  { path: 'sales_led.sales_capacity.attainment',                            label: 'Rep attainment' },
  { path: 'sales_led.sales_capacity.fully_ramped_quota_annual',             label: 'Fully-ramped quota' },
  { path: 'sales_led.existing_customer_dynamics.business_large.gross_churn',label: 'Sales-led churn' },
  { path: 'sales_led.existing_customer_dynamics.business_large.expansion',  label: 'Expansion rate' },
  { path: 'self_serve.retention.business_small.decay',                      label: 'Retention decay · Business' },
  { path: 'costs.sm.marketing_programs_pct_of_revenue',                     label: 'Marketing programs %' },
];

const SHOCK = 0.10;

function readPath(obj: unknown, path: string): number {
  let cur: unknown = obj;
  for (const k of path.split('.')) {
    if (cur && typeof cur === 'object') cur = (cur as Record<string, unknown>)[k];
    else return NaN;
  }
  return typeof cur === 'number' ? cur : NaN;
}

function setPath(obj: Record<string, unknown>, path: string, val: number): void {
  const ks = path.split('.');
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < ks.length - 1; i++) {
    cur = cur[ks[i]] as Record<string, unknown>;
  }
  cur[ks[ks.length - 1]] = val;
}

interface Impact {
  label: string;
  path: string;
  upPct: number;
  downPct: number;
  upDelta: number;
  downDelta: number;
  absMax: number;
}

export default function TornadoChart() {
  const { assumptions } = useRevenue();

  const impacts = useMemo<Impact[]>(() => {
    const baseEnding = simulate(assumptions, 'base').ending_arr;
    const out: Impact[] = [];
    for (const d of DRIVERS) {
      const baseVal = readPath(assumptions, d.path);
      if (!Number.isFinite(baseVal) || baseVal === 0) continue;

      const upA: Assumptions = JSON.parse(JSON.stringify(assumptions));
      setPath(upA as unknown as Record<string, unknown>, d.path, baseVal * (1 + SHOCK));
      const upArr = simulate(upA, 'base').ending_arr;

      const downA: Assumptions = JSON.parse(JSON.stringify(assumptions));
      setPath(downA as unknown as Record<string, unknown>, d.path, baseVal * (1 - SHOCK));
      const downArr = simulate(downA, 'base').ending_arr;

      const upDelta = upArr - baseEnding;
      const downDelta = downArr - baseEnding;
      out.push({
        label: d.label,
        path: d.path,
        upPct: upDelta / baseEnding,
        downPct: downDelta / baseEnding,
        upDelta,
        downDelta,
        absMax: Math.max(Math.abs(upDelta), Math.abs(downDelta)),
      });
    }
    return out.sort((a, b) => b.absMax - a.absMax);
  }, [assumptions]);

  const baseEnding = useMemo(() => simulate(assumptions, 'base').ending_arr, [assumptions]);
  const maxAbsPct = Math.max(0.01, ...impacts.map(i => Math.max(Math.abs(i.upPct), Math.abs(i.downPct))));

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div>
          <div className="hand" style={{ fontSize: 18 }}>Tornado · sensitivity to ±10% driver shock</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            Base ending ARR: {fmtMoneyScaled(baseEnding, { precision: 1 })}. Bars show change in ending ARR.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--ink-3)' }}>
          <LegendSwatch color="var(--accent-good)" label="Driver +10%" />
          <LegendSwatch color="var(--accent-warn)" label="Driver −10%" />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {impacts.map(imp => (
          <Row key={imp.path} imp={imp} maxAbsPct={maxAbsPct} />
        ))}
      </div>

      <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 10 }}>
        Each row independently runs the model with one driver shocked +10% and −10%. Other drivers held constant.
      </div>
    </div>
  );
}

function Row({ imp, maxAbsPct }: { imp: Impact; maxAbsPct: number }) {
  const labelW = 220;
  const numW = 110;
  const barTrackPct = 100;
  const center = barTrackPct / 2;
  const upWidthPct = (Math.abs(imp.upPct) / maxAbsPct) * (barTrackPct / 2);
  const downWidthPct = (Math.abs(imp.downPct) / maxAbsPct) * (barTrackPct / 2);

  // Up shock could be positive or negative depending on driver direction
  const upRight = imp.upPct >= 0;
  const downRight = imp.downPct >= 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `${labelW}px 1fr ${numW}px`,
      alignItems: 'center',
      gap: 8,
      borderBottom: '1px dashed var(--line-softer)',
      padding: '4px 0',
    }}>
      <div style={{
        fontFamily: 'var(--font-architects-daughter), cursive',
        fontSize: 12,
        color: 'var(--ink-2)',
        textAlign: 'right',
      }}>{imp.label}</div>

      <div style={{ position: 'relative', height: 20 }}>
        {/* Center axis */}
        <div style={{
          position: 'absolute',
          left: `${center}%`,
          top: 0, bottom: 0,
          width: 1,
          background: 'var(--line)',
        }} />
        {/* Down bar */}
        <div style={{
          position: 'absolute',
          top: 3, bottom: 3,
          left: downRight ? `${center}%` : `${center - downWidthPct}%`,
          width: `${downWidthPct}%`,
          background: 'var(--accent-warn)',
          border: '1px solid var(--ink)',
          opacity: 0.85,
        }} />
        {/* Up bar */}
        <div style={{
          position: 'absolute',
          top: 3, bottom: 3,
          left: upRight ? `${center}%` : `${center - upWidthPct}%`,
          width: `${upWidthPct}%`,
          background: 'var(--accent-good)',
          border: '1px solid var(--ink)',
          opacity: 0.85,
        }} />
      </div>

      <div style={{
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 11,
        fontVariantNumeric: 'tabular-nums',
        color: 'var(--ink)',
        textAlign: 'right',
      }}>
        <div style={{ color: 'var(--accent-good)' }}>{fmtPctScaled(imp.upPct, 1)}</div>
        <div style={{ color: 'var(--accent-warn)' }}>{fmtPctScaled(imp.downPct, 1)}</div>
      </div>
    </div>
  );
}

