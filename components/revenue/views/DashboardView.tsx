'use client';

import KpiTilesRow from '../dashboard/KpiTilesRow';
import ArrWaterfall from '../dashboard/ArrWaterfall';
import ArrTrendChart from '../dashboard/ArrTrendChart';
import BillingsRevenueChart from '../dashboard/BillingsRevenueChart';
import IpoValuationWalk from '../dashboard/IpoValuationWalk';
import ValidationFooter from '../dashboard/ValidationFooter';
import ScenarioToggle from '../shared/ScenarioToggle';

export default function DashboardView() {
  return (
    <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Temp dev scenario pill (replaced by top-bar toggle in 5c) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div>
          <div style={{
            fontSize: 9,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--ink-4)',
            marginBottom: 3,
            fontFamily: 'var(--font-architects-daughter), cursive',
          }}>
            scenario · dev pill
          </div>
          <ScenarioToggle />
        </div>
      </div>

      <KpiTilesRow />

      <ArrWaterfall />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <ArrTrendChart />
        <BillingsRevenueChart />
      </div>

      <IpoValuationWalk />

      <ValidationFooter />
    </div>
  );
}
