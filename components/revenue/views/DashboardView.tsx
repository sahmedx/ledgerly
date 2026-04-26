'use client';

import KpiTilesRow from '../dashboard/KpiTilesRow';
import ArrWaterfall from '../dashboard/ArrWaterfall';
import ArrTrendChart from '../dashboard/ArrTrendChart';
import BillingsRevenueChart from '../dashboard/BillingsRevenueChart';
import IpoValuationWalk from '../dashboard/IpoValuationWalk';
import ValidationFooter from '../dashboard/ValidationFooter';

export default function DashboardView() {
  return (
    <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
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
