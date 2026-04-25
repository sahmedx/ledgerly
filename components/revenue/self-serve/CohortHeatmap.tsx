'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import type { Assumptions, RetentionParams, SelfServeTierId } from '@/lib/revenue/types';

const AGE_MILESTONES = [0, 1, 2, 3, 6, 9, 12, 15, 17];

function retentionAt(age: number, p: RetentionParams): number {
  return p.floor + (1 - p.floor) * Math.exp(-p.decay * age);
}

/** Months until retention drops to 50% of original (or "≥18" if never crosses). */
function halfLifeMonths(p: RetentionParams): number | null {
  if (p.floor >= 0.5) return null;
  // 0.5 = floor + (1-floor)*e^(-d*a)  →  a = -ln((0.5-floor)/(1-floor)) / d
  const a = -Math.log((0.5 - p.floor) / (1 - p.floor)) / p.decay;
  return a;
}

function cellTint(pct: number): string {
  const t = Math.max(0, Math.min(1, (pct - 0.3) / 0.7));
  return `color-mix(in oklch, var(--accent-warn) ${(1 - t) * 28}%, color-mix(in oklch, var(--accent-good) ${t * 36}%, white))`;
}

interface TierConfig {
  id: SelfServeTierId;
  label: string;
  paramsNew: RetentionParams;
  paramsLegacy: RetentionParams;
}

function tierConfigs(A: Assumptions): TierConfig[] {
  return [
    {
      id: 'plus',
      label: 'Plus',
      paramsNew:    A.self_serve.retention.plus,
      paramsLegacy: A.self_serve.retention.legacy_plus,
    },
    {
      id: 'business_small',
      label: 'Business (small)',
      paramsNew:    A.self_serve.retention.business_small,
      paramsLegacy: A.self_serve.retention.legacy_business_small,
    },
  ];
}

export default function CohortHeatmap() {
  const { assumptions: A } = useRevenue();
  const tiers = tierConfigs(A);

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <div className="hand" style={{ fontSize: 18 }}>Cohort retention curves</div>
        <div style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
          retention(age) = floor + (1 − floor) · e<sup>−decay · age</sup>
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 12 }}>
        % of original workspaces still active at age <em>n</em> months. New post-Day-0 cohorts decay faster than the
        Day-0 legacy cohort (selection bias: legacy customers self-selected long ago).
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {tiers.map(t => <TierBlock key={t.id} t={t} />)}
      </div>
    </div>
  );
}

function TierBlock({ t }: { t: TierConfig }) {
  const rows: { label: string; emphasis: boolean; params: RetentionParams }[] = [
    { label: 'New cohort',    emphasis: true,  params: t.paramsNew },
    { label: 'Legacy cohort', emphasis: false, params: t.paramsLegacy },
  ];

  return (
    <div>
      <div style={{
        fontSize: 11,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--ink-2)',
        fontFamily: 'var(--font-architects-daughter), cursive',
        marginBottom: 6,
      }}>{t.label}</div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `100px repeat(${AGE_MILESTONES.length}, 1fr)`,
        gap: 2,
        alignItems: 'stretch',
      }}>
        {/* Header row */}
        <div />
        {AGE_MILESTONES.map(a => (
          <div key={a} style={{
            textAlign: 'center',
            fontSize: 9,
            color: 'var(--ink-4)',
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            paddingBottom: 3,
          }}>
            mo {a}
          </div>
        ))}

        {/* Data rows */}
        {rows.map((row, ri) => (
          <Row key={ri} row={row} />
        ))}
      </div>

      <div style={{
        marginTop: 8,
        display: 'flex',
        gap: 18,
        fontSize: 11,
        color: 'var(--ink-3)',
      }}>
        <Stat label="Floor"            valueNew={fmtPct(t.paramsNew.floor)}                         valueLegacy={fmtPct(t.paramsLegacy.floor)} />
        <Stat label="Decay"            valueNew={t.paramsNew.decay.toFixed(2)}                       valueLegacy={t.paramsLegacy.decay.toFixed(2)} />
        <Stat label="Half-life (mo)"   valueNew={fmtHalfLife(halfLifeMonths(t.paramsNew))}           valueLegacy={fmtHalfLife(halfLifeMonths(t.paramsLegacy))} />
        <Stat label="Year-1 retention" valueNew={fmtPct(retentionAt(12, t.paramsNew))}               valueLegacy={fmtPct(retentionAt(12, t.paramsLegacy))} />
      </div>
    </div>
  );
}

function Row({ row }: { row: { label: string; emphasis: boolean; params: RetentionParams } }) {
  return (
    <>
      <div style={{
        fontSize: 11,
        color: row.emphasis ? 'var(--ink)' : 'var(--ink-3)',
        fontWeight: row.emphasis ? 700 : 400,
        fontFamily: 'var(--font-architects-daughter), cursive',
        display: 'flex',
        alignItems: 'center',
        paddingRight: 6,
      }}>{row.label}</div>
      {AGE_MILESTONES.map(a => {
        const pct = retentionAt(a, row.params);
        return (
          <div
            key={a}
            title={`age ${a}: ${(pct * 100).toFixed(1)}%`}
            style={{
              background: cellTint(pct),
              border: '1px solid var(--line-softer)',
              padding: '6px 0',
              textAlign: 'center',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 11,
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--ink)',
              fontWeight: row.emphasis ? 600 : 500,
            }}
          >
            {(pct * 100).toFixed(0)}%
          </div>
        );
      })}
    </>
  );
}

function Stat({ label, valueNew, valueLegacy }: { label: string; valueNew: string; valueLegacy: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{
        fontSize: 9,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--ink-4)',
      }}>{label}</div>
      <div className="num" style={{
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 11,
        color: 'var(--ink-2)',
        marginTop: 1,
      }}>
        <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{valueNew}</span>
        <span style={{ color: 'var(--ink-4)', margin: '0 4px' }}>·</span>
        <span>{valueLegacy}</span>
      </div>
    </div>
  );
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

function fmtHalfLife(n: number | null): string {
  if (n === null) return '—';
  if (n > 18) return '≥18';
  return n.toFixed(1);
}
