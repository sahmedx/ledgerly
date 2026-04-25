'use client';

import { VENDOR_SERIES, ACTUAL_THROUGH, fmtMoney } from '@/lib/data';
import { useOverrides, useTweaks } from '@/lib/contexts';
import Sparkline from '@/components/shared/Sparkline';

interface Props {
  title: string;
  tone: 'warn' | 'good';
}

export default function VarianceList({ title, tone }: Props) {
  const { overrides } = useOverrides();
  const { tweaks } = useTweaks();

  const rows = VENDOR_SERIES.filter(v => v.variance === (tone === 'warn' ? 'over' : 'good'));

  return (
    <div className="sketch-box" style={{ background: '#fff' }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--line-softer)',
        fontWeight: 700,
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
      }}>
        <span>{title}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3)' }}>{rows.length} vendors</span>
      </div>
      {rows.map(v => {
        const curVal = overrides[v.name]?.[ACTUAL_THROUGH] !== undefined
          ? overrides[v.name][ACTUAL_THROUGH]
          : v.series[ACTUAL_THROUGH].value;
        const delta = Math.round(curVal - v.series[ACTUAL_THROUGH].budget);
        const pillClass = tone === 'warn' && tweaks.varianceColor
          ? 'pill pill-warn'
          : tone === 'good' && tweaks.varianceColor
            ? 'pill pill-good'
            : 'pill pill-neutral';
        return (
          <div key={v.name} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 80px 60px 90px',
            padding: '8px 14px',
            borderBottom: '1px dashed var(--line-softer)',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
          }}>
            <div>
              <div style={{ fontWeight: 600, fontFamily: 'var(--font-architects-daughter), cursive' }}>
                {v.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{v.cat} · {v.owner}</div>
            </div>
            <Sparkline series={v.series.slice(0, 14)} width={70} height={16} highlightIdx={ACTUAL_THROUGH} />
            <div className="num" style={{ textAlign: 'right' }}>
              {fmtMoney(curVal, { compact: true })}
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={pillClass}>
                {delta > 0 ? '+' : ''}{fmtMoney(delta, { compact: true })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
