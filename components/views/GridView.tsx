'use client';

import { useState } from 'react';
import { VENDOR_SERIES } from '@/lib/data';
import FilterBar from '@/components/shared/FilterBar';
import VendorGrid from '@/components/grid/VendorGrid';
import { useTweaks } from '@/lib/contexts';

type SortState = { col: 'name' | 'gl' | 'method'; dir: 'asc' | 'desc' } | null;

export default function GridView() {
  const { tweaks, setTweaks } = useTweaks();
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<SortState>(null);

  const filteredVendors = searchQuery.trim()
    ? VENDOR_SERIES.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : VENDOR_SERIES;

  const sortedVendors = sort
    ? [...filteredVendors].sort((a, b) => {
        const cmp = a[sort.col].localeCompare(b[sort.col]);
        return sort.dir === 'asc' ? cmp : -cmp;
      })
    : filteredVendors;

  const handleSort = (col: 'name' | 'gl' | 'method') => {
    setSort(prev => {
      if (prev?.col !== col) return { col, dir: 'asc' };
      if (prev.dir === 'asc') return { col, dir: 'desc' };
      return null;
    });
  };

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        chips={[
          { label: 'Category: all', active: false },
          { label: 'Owner: all', active: false },
          { label: 'Method: any', active: false },
          { label: 'Status: working', active: true },
        ]}
        right={
          <>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>View</span>
            <div
              className="btn"
              style={{ fontSize: 12 }}
              onClick={() => setTweaks({ timeUnit: tweaks.timeUnit === 'quarterly' ? 'monthly' : 'quarterly' })}
            >
              {tweaks.timeUnit === 'quarterly' ? 'Quarterly ▾' : 'Monthly ▾'}
            </div>
          </>
        }
      />
      <VendorGrid vendors={sortedVendors} sort={sort} onSort={handleSort} />

    </div>
  );
}
