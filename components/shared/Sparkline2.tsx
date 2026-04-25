import type { MonthPoint } from '@/lib/types';

interface Props {
  series: MonthPoint[];
  width?: number;
  height?: number;
}

export default function Sparkline2({ series, width = 240, height = 44 }: Props) {
  const max = Math.max(...series.map(s => s.value)) || 1;
  const min = Math.min(...series.map(s => s.value));
  const pad = 2;

  const toXY = (v: number, i: number): [number, number] => {
    const x = (i / (series.length - 1)) * (width - pad * 2) + pad;
    const y = height - pad - ((v - min) / (max - min || 1)) * (height - pad * 2);
    return [x, y];
  };

  const splitIdx = series.findIndex(s => !s.isActual);

  const actualPath = series
    .slice(0, splitIdx + 1)
    .map((s, i) => {
      const [x, y] = toXY(s.value, i);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const forecastPath = series
    .slice(splitIdx)
    .map((s, i) => {
      const [x, y] = toXY(s.value, splitIdx + i);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const [sx, sy] = toXY(series[splitIdx].value, splitIdx);

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={actualPath} stroke="var(--ink)" strokeWidth="1.5" fill="none" />
      <path d={forecastPath} stroke="var(--ink-3)" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
      <line x1={sx} x2={sx} y1={0} y2={height} stroke="var(--line-soft)" strokeDasharray="1 2" />
      <circle cx={sx} cy={sy} r="2.5" fill="#fff" stroke="var(--ink)" strokeWidth="1.2" />
    </svg>
  );
}
