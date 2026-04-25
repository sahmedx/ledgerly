'use client';

import { useState } from 'react';
import { VENDOR_SERIES } from '@/lib/data';
import VendorList from '@/components/split/VendorList';
import VendorDetail from '@/components/split/VendorDetail';

export default function SplitView() {
  const [selectedIdx, setSelectedIdx] = useState(2); // default: Datadog

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
      <VendorList selectedIdx={selectedIdx} onSelect={setSelectedIdx} />
      <VendorDetail vendor={VENDOR_SERIES[selectedIdx]} />
    </div>
  );
}
