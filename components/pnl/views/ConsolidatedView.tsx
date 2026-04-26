'use client';

import { useMemo } from 'react';
import { useRevenue } from '@/lib/revenue/contexts';
import { CONSOLIDATED_LINES } from '@/lib/revenue/pnl-line-items';
import { buildColumns } from '../shared/columns';
import { usePnl } from '../PnlContext';
import PnlTable from '../shared/PnlTable';
import ExpandToggle from '../shared/ExpandToggle';
import ReconciliationPanel from '../segment/ReconciliationPanel';

export default function ConsolidatedView() {
  const { results, activeScenario } = useRevenue();
  const r = results[activeScenario];
  const { expandedQuarters } = usePnl();

  const columns = useMemo(
    () => buildColumns(r.quarterly, r.annual, r.monthly, expandedQuarters),
    [r.quarterly, r.annual, r.monthly, expandedQuarters],
  );

  return (
    <div style={{ padding: '14px 18px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="hand" style={{ fontSize: 16 }}>
          Consolidated P&L · 8 quarters + FY26 / FY27
        </div>
        <ExpandToggle />
      </div>
      <PnlTable columns={columns} lines={CONSOLIDATED_LINES} segmentLabel="Consolidated" />
      <ReconciliationPanel />
    </div>
  );
}
