'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RevenueContext } from '@/lib/revenue/contexts';
import { DEFAULT_ASSUMPTIONS } from '@/lib/revenue/defaults';
import { simulate } from '@/lib/revenue/engine';
import type { Assumptions, ScenarioId } from '@/lib/revenue/types';

const STORAGE_KEY = 'ledgerly-revenue-assumptions';
const SCENARIO_KEY = 'ledgerly-revenue-scenario';

function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]] = value;
}

/** Deep-merge `stored` over `defaults`. Plain objects merge key-by-key; arrays and
 *  primitives in `stored` overwrite the default. Used on hydration so that saved
 *  assumptions missing newer keys (e.g. costs.sbc, costs.da, costs.allocation, or
 *  the extended 24-entry hiring plans) fall back to defaults instead of crashing. */
function deepMerge<T>(defaults: T, stored: unknown): T {
  if (stored === null || stored === undefined) return defaults;
  if (typeof defaults !== 'object' || defaults === null) return stored as T;
  if (Array.isArray(defaults)) return (stored as T) ?? defaults;
  if (typeof stored !== 'object' || Array.isArray(stored)) return defaults;
  const out: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
  const s = stored as Record<string, unknown>;
  for (const key of Object.keys(out)) {
    if (key in s) {
      out[key] = deepMerge(out[key] as unknown, s[key]);
    }
  }
  return out as T;
}

export default function RevenueProvider({ children }: { children: React.ReactNode }) {
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [activeScenario, setActiveScenarioState] = useState<ScenarioId>('base');

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Deep-merge over defaults so old saved state (missing costs.sbc / costs.da /
        // costs.allocation, or 18-entry hiring plans) hydrates safely.
        setAssumptions(deepMerge(DEFAULT_ASSUMPTIONS, parsed));
      }
      const s = window.localStorage.getItem(SCENARIO_KEY);
      if (s === 'base' || s === 'upside' || s === 'downside') setActiveScenarioState(s);
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((next: Assumptions) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const setAssumption = useCallback((path: string, value: unknown) => {
    setAssumptions(prev => {
      const next: Assumptions = JSON.parse(JSON.stringify(prev));
      setByPath(next as unknown as Record<string, unknown>, path, value);
      persist(next);
      return next;
    });
  }, [persist]);

  const resetToDefaults = useCallback(() => {
    setAssumptions(DEFAULT_ASSUMPTIONS);
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const setActiveScenario = useCallback((s: ScenarioId) => {
    setActiveScenarioState(s);
    try { window.localStorage.setItem(SCENARIO_KEY, s); } catch {}
  }, []);

  // Memoized results — three scenarios run in parallel (sequential calls, all on main thread)
  const results = useMemo(() => ({
    base:     simulate(assumptions, 'base'),
    upside:   simulate(assumptions, 'upside'),
    downside: simulate(assumptions, 'downside'),
  }), [assumptions]);

  const value = useMemo(() => ({
    assumptions,
    setAssumption,
    resetToDefaults,
    results,
    activeScenario,
    setActiveScenario,
  }), [assumptions, setAssumption, resetToDefaults, results, activeScenario, setActiveScenario]);

  return (
    <RevenueContext.Provider value={value}>
      {children}
    </RevenueContext.Provider>
  );
}
