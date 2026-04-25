'use client';

import { useState, useCallback } from 'react';
import { OverridesContext, TweaksContext } from '@/lib/contexts';
import { useLocalStorage, saveOverride } from '@/lib/storage';
import type { OverridesMap, Tweaks } from '@/lib/types';
import AppShell from '@/components/shell/AppShell';
import TweaksPanel from '@/components/shared/TweaksPanel';
import GridView from '@/components/views/GridView';
import SplitView from '@/components/views/SplitView';
import TimelineView from '@/components/views/TimelineView';
import VarianceView from '@/components/views/VarianceView';

type ViewId = 'grid' | 'vendor' | 'timeline' | 'variance';

const TWEAK_DEFAULTS: Tweaks = {
  density: 'regular',
  varianceColor: true,
  showAnnotations: true,
  timeUnit: 'monthly',
};

export default function Page() {
  const [activeView, setActiveView] = useState<ViewId>('grid');
  const [overrides, setOverridesRaw] = useLocalStorage<OverridesMap>('ledgerly-overrides', {});
  const [tweaks, setTweaksRaw] = useState<Tweaks>(TWEAK_DEFAULTS);

  const setOverride = useCallback((vendorName: string, monthIdx: number, value: number) => {
    setOverridesRaw(saveOverride(overrides, vendorName, monthIdx, value));
  }, [overrides, setOverridesRaw]);

  const setTweaks = useCallback((patch: Partial<Tweaks>) => {
    setTweaksRaw(prev => ({ ...prev, ...patch }));
  }, []);

  return (
    <OverridesContext.Provider value={{ overrides, setOverride }}>
      <TweaksContext.Provider value={{ tweaks, setTweaks }}>
        <AppShell activeView={activeView} onViewChange={setActiveView}>
          {activeView === 'grid'     && <GridView />}
          {activeView === 'vendor'   && <SplitView />}
          {activeView === 'timeline' && <TimelineView />}
          {activeView === 'variance' && <VarianceView />}
        </AppShell>
        <TweaksPanel />
      </TweaksContext.Provider>
    </OverridesContext.Provider>
  );
}
