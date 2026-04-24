interface Props {
  variance: 'over' | 'good' | 'flat';
}

export default function VarianceBadge({ variance }: Props) {
  if (variance === 'over') return <span className="pill pill-warn">▲ over</span>;
  if (variance === 'good') return <span className="pill pill-good">▼ under</span>;
  return <span className="pill pill-neutral">◦ flat</span>;
}
