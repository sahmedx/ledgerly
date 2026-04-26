'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface PnlContextValue {
  /** Set of quarter indices (0..7) currently expanded to show monthly sub-cols. */
  expandedQuarters: Set<number>;
  toggleQuarter: (q: number) => void;
  expandAll: () => void;
  collapseAll: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

const Ctx = createContext<PnlContextValue | null>(null);

export function PnlProvider({ children }: { children: React.ReactNode }) {
  const [expandedQuarters, setExpandedQuarters] = useState<Set<number>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleQuarter = useCallback((q: number) => {
    setExpandedQuarters(prev => {
      const next = new Set(prev);
      if (next.has(q)) next.delete(q); else next.add(q);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedQuarters(new Set([0, 1, 2, 3, 4, 5, 6, 7]));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedQuarters(new Set());
  }, []);

  const value = useMemo(() => ({
    expandedQuarters, toggleQuarter, expandAll, collapseAll, drawerOpen, setDrawerOpen,
  }), [expandedQuarters, toggleQuarter, expandAll, collapseAll, drawerOpen]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePnl(): PnlContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePnl must be used inside PnlProvider');
  return ctx;
}
