'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtNumberX } from '@/lib/revenue/format';

interface Band { from: number; to: number; tone: 'good' | 'neutral' | 'warn'; }

const TONE_FILL: Record<Band['tone'], string> = {
  good:    'color-mix(in oklch, var(--accent-good) 35%, white)',
  neutral: 'color-mix(in oklch, var(--accent-cool) 22%, white)',
  warn:    'color-mix(in oklch, var(--accent-warn) 35%, white)',
};

interface BulletProps {
  label: string;
  value: number;
  display: string;
  unit: string;
  /** Band ranges in the same unit as value. Order: low → high. */
  bands: Band[];
  /** Right-edge of the scale. */
  scaleMax: number;
  /** Lower-is-better metric (payback months); inverts label colors. */
  lowerBetter?: boolean;
}

function tone(value: number, bands: Band[]): Band['tone'] {
  for (const b of bands) {
    if (value >= b.from && value < b.to) return b.tone;
  }
  return bands[bands.length - 1].tone;
}

function Bullet({ label, value, display, unit, bands, scaleMax, lowerBetter }: BulletProps) {
  const W = 320, H = 36;
  const padL = 0, padR = 28, padT = 12;
  const innerW = W - padL - padR;
  const barH = 14;
  const x = (v: number) => padL + Math.max(0, Math.min(1, v / scaleMax)) * innerW;
  const valueColor = (() => {
    const t = tone(value, bands);
    if (t === 'good') return 'var(--accent-good)';
    if (t === 'warn') return 'var(--accent-warn)';
    return 'var(--ink)';
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{
          fontSize: 10,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ink-4)',
          fontFamily: 'var(--font-architects-daughter), cursive',
        }}>{label}</div>
        <div className="num" style={{ fontSize: 14, fontWeight: 500, color: valueColor }}>
          {display}<span style={{ fontSize: 10, color: 'var(--ink-3)', marginLeft: 4 }}>{unit}</span>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {bands.map((b, i) => (
          <rect
            key={i}
            x={x(b.from)}
            y={padT}
            width={x(b.to) - x(b.from)}
            height={barH}
            fill={TONE_FILL[b.tone]}
            stroke="var(--line-softer)"
            strokeWidth={0.5}
          />
        ))}
        {/* Value marker */}
        <line
          x1={x(value)}
          x2={x(value)}
          y1={padT - 3}
          y2={padT + barH + 3}
          stroke="var(--ink)"
          strokeWidth={1.6}
        />
        <text
          x={x(scaleMax) + 4}
          y={padT + barH - 3}
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink-4)' }}
        >
          {lowerBetter ? `${scaleMax}+` : `${scaleMax}×`}
        </text>
      </svg>
    </div>
  );
}

export default function BulletCards() {
  const { results, activeScenario } = useRevenue();
  const last = results[activeScenario].monthly[results[activeScenario].monthly.length - 1];

  const ssPayback = last.kpis.cac_payback_self_serve;
  const slPayback = last.kpis.cac_payback_sales_led;
  const ssRatio = last.kpis.ltv_cac_self_serve;
  const slRatio = last.kpis.ltv_cac_sales_led;

  // Benchmark zones (industry SaaS norms).
  // Payback: ≤12mo great, 12–24 fine, 24–36 stretched, >36 bad. Lower is better.
  const paybackBands: Band[] = [
    { from: 0,  to: 12, tone: 'good' },
    { from: 12, to: 24, tone: 'neutral' },
    { from: 24, to: 48, tone: 'warn' },
  ];
  // LTV/CAC: <1 bleeding, 1–3 weak, ≥3 strong. Higher is better.
  const ratioBands: Band[] = [
    { from: 0, to: 1, tone: 'warn' },
    { from: 1, to: 3, tone: 'neutral' },
    { from: 3, to: 8, tone: 'good' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14,
    }}>
      <Card title="Self-serve" accent="var(--accent-cool)">
        <Bullet
          label="CAC Payback"
          value={ssPayback}
          display={ssPayback.toFixed(1)}
          unit="mo"
          bands={paybackBands}
          scaleMax={48}
          lowerBetter
        />
        <Bullet
          label="LTV / CAC"
          value={ssRatio}
          display={fmtNumberX(ssRatio, 1)}
          unit=""
          bands={ratioBands}
          scaleMax={8}
        />
      </Card>
      <Card title="Sales-led" accent="var(--accent-good)">
        <Bullet
          label="CAC Payback"
          value={slPayback}
          display={slPayback.toFixed(1)}
          unit="mo"
          bands={paybackBands}
          scaleMax={48}
          lowerBetter
        />
        <Bullet
          label="LTV / CAC"
          value={slRatio}
          display={fmtNumberX(slRatio, 1)}
          unit=""
          bands={ratioBands}
          scaleMax={8}
        />
      </Card>
    </div>
  );
}

function Card({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="sketch-box" style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div className="hand" style={{ fontSize: 16, color: accent }}>{title}</div>
        <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>vs SaaS benchmarks</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}
