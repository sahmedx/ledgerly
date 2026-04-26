'use client';

import { useState, useCallback } from 'react';
import { OverridesContext, TweaksContext } from '@/lib/contexts';
import { useLocalStorage, saveOverride } from '@/lib/storage';
import type { OverridesMap, Tweaks } from '@/lib/types';
import AppShell, { type ViewTab, type AppShellMeta } from '@/components/shell/AppShell';
import { type ModuleId } from '@/components/shell/Sidebar';
import TweaksPanel from '@/components/shared/TweaksPanel';
import GridView from '@/components/views/GridView';
import SplitView from '@/components/views/SplitView';
import TimelineView from '@/components/views/TimelineView';
import VarianceView from '@/components/views/VarianceView';
import RevenueProvider from '@/components/revenue/RevenueProvider';
import RevenueModule from '@/components/revenue/RevenueModule';
import PnlModule from '@/components/pnl/PnlModule';

const TWEAK_DEFAULTS: Tweaks = {
  density: 'regular',
  varianceColor: true,
  showAnnotations: true,
  timeUnit: 'monthly',
};

const EXPENSE_VIEWS: ViewTab[] = [
  { id: 'grid',     label: 'Grid',     sub: 'edit',      icon: '▦' },
  { id: 'vendor',   label: 'Vendor',   sub: 'drill-in',  icon: '◧' },
  { id: 'timeline', label: 'Timeline', sub: 'scenarios', icon: '⎯' },
  { id: 'variance', label: 'Variance', sub: 'dashboard', icon: '◭' },
];

const EXPENSE_VIEW_META: Record<string, { title: string; subtitle: string }> = {
  grid:     { title: 'Vendor Opex · FY26 + FY27 H1', subtitle: '25 vendors · $1.42M annualized' },
  vendor:   { title: 'Vendors',                       subtitle: '$1.42M annualized · 25 active' },
  timeline: { title: 'Forecast Canvas',               subtitle: 'Drag cards between scenarios · $1.42M base' },
  variance: { title: 'FY26 Variance',                 subtitle: "Apr '26 close · $11.4k over plan MTD" },
};

const EXPENSE_ACTIONS: Record<string, React.ReactNode> = {
  grid:     <><button className="btn">⤓ Export</button><button className="btn">⚙ Columns</button><button className="btn btn-primary">+ Vendor</button></>,
  vendor:   <><button className="btn">⤓ Export</button><button className="btn btn-primary">+ Vendor</button></>,
  timeline: <><button className="btn">+ Scenario</button><button className="btn btn-primary">Commit plan</button></>,
  variance: <><button className="btn">⤓ Board pack</button><button className="btn btn-primary">Reforecast</button></>,
};

export default function Page() {
  const [module, setModule] = useState<ModuleId>('expenses');
  const [expenseView, setExpenseView] = useState<string>('grid');
  const [revenueView, setRevenueView] = useState<string>('dashboard');
  const [pnlView, setPnlView] = useState<string>('consolidated');

  const [overrides, setOverridesRaw] = useLocalStorage<OverridesMap>('ledgerly-overrides', {});
  const [tweaks, setTweaksRaw] = useState<Tweaks>(TWEAK_DEFAULTS);

  const setOverride = useCallback((vendorName: string, monthIdx: number, value: number) => {
    setOverridesRaw(saveOverride(overrides, vendorName, monthIdx, value));
  }, [overrides, setOverridesRaw]);

  const setTweaks = useCallback((patch: Partial<Tweaks>) => {
    setTweaksRaw(prev => ({ ...prev, ...patch }));
  }, []);

  if (module === 'expenses') {
    const meta: AppShellMeta = {
      breadcrumbSuffix: 'FY26 Plan · Opex',
      title: EXPENSE_VIEW_META[expenseView].title,
      subtitle: EXPENSE_VIEW_META[expenseView].subtitle,
      actions: EXPENSE_ACTIONS[expenseView],
    };
    return (
      <OverridesContext.Provider value={{ overrides, setOverride }}>
        <TweaksContext.Provider value={{ tweaks, setTweaks }}>
          <AppShell
            module={module}
            onModuleChange={setModule}
            activeView={expenseView}
            onViewChange={setExpenseView}
            views={EXPENSE_VIEWS}
            meta={meta}
          >
            {expenseView === 'grid'     && <GridView />}
            {expenseView === 'vendor'   && <SplitView />}
            {expenseView === 'timeline' && <TimelineView />}
            {expenseView === 'variance' && <VarianceView />}
          </AppShell>
          <TweaksPanel />
        </TweaksContext.Provider>
      </OverridesContext.Provider>
    );
  }

  // Revenue + P&L share a single RevenueProvider so a single engine compute drives both.
  return (
    <RevenueProvider>
      {module === 'revenue' && (
        <RevenueModule
          module={module}
          onModuleChange={setModule}
          activeView={revenueView}
          onViewChange={setRevenueView}
        />
      )}
      {module === 'pnl' && (
        <PnlModule
          module={module}
          onModuleChange={setModule}
          activeView={pnlView}
          onViewChange={setPnlView}
        />
      )}
    </RevenueProvider>
  );
}
