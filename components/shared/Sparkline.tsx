import type { MonthPoint } from '@/lib/types';

interface Props {
  series: MonthPoint[];
  width?: number;
  height?: number;
  highlightIdx?: number | null;
}

export default function Sparkline({ series, width = 90, height = 18, highlightIdx = null }: Props) {
  const max = Math.max(...series.map(s => s.value)) || 1;
  const bw = Math.max(2, (width - series.length) / series.length);
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {series.map((s, i) => {
        const h = Math.max(1, (s.value / max) * (height - 2));
        const x = i * (bw + 1);
        const fill = i === highlightIdx
          ? 'var(--accent-warn)'
          : s.isActual ? 'var(--ink)' : 'var(--ink-4)';
        return <rect key={i} x={x} y={height - h} width={bw} height={h} fill={fill} />;
      })}
    </svg>
  );
}
