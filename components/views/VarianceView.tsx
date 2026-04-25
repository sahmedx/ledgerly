import KpiTiles from '@/components/variance/KpiTiles';
import VarianceList from '@/components/variance/VarianceList';
import CategoryChart from '@/components/variance/CategoryChart';

export default function VarianceView() {
  return (
    <div
      style={{ flex: 1, minWidth: 0, overflow: 'auto', padding: '16px 18px', background: 'var(--paper)' }}
      className="hide-scroll"
    >
      <KpiTiles />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
        <VarianceList title="Over plan · biggest offenders" tone="warn" />
        <VarianceList title="Under plan · savings" tone="good" />
      </div>
      <CategoryChart />
    </div>
  );
}
