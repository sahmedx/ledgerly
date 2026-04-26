interface Props {
  color: string;
  label: string;
  shape?: 'box' | 'line';
  border?: string;
  dashed?: boolean;
}

export default function LegendSwatch({
  color, label, shape = 'box', border = 'var(--ink)', dashed,
}: Props) {
  const swatch = shape === 'line'
    ? { width: 14, height: 0, borderTop: `2px ${dashed ? 'dashed' : 'solid'} ${color}` }
    : { width: 10, height: 10, background: color, border: `1px solid ${border}` };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ display: 'inline-block', ...swatch }} />
      <span>{label}</span>
    </span>
  );
}
