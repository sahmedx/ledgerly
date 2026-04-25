'use client';

import { createContext, useContext } from 'react';
import type { Assumptions, Results, ScenarioId } from './types';

export interface RevenueContextValue {
  assumptions: Assumptions;
  setAssumption: (path: string, value: unknown) => void;
  resetToDefaults: () => void;
  results: Record<ScenarioId, Results>;
  activeScenario: ScenarioId;
  setActiveScenario: (s: ScenarioId) => void;
}

export const RevenueContext = createContext<RevenueContextValue | null>(null);

export function useRevenue(): RevenueContextValue {
  const ctx = useContext(RevenueContext);
  if (!ctx) throw new Error('useRevenue must be used inside RevenueProvider');
  return ctx;
}
