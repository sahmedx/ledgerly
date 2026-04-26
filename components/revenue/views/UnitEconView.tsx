'use client';

import UeKpiTiles from '../unit-econ/UeKpiTiles';
import MathCallouts from '../unit-econ/MathCallouts';
import BulletCards from '../unit-econ/BulletCards';
import CohortDecay from '../unit-econ/CohortDecay';
import CacComposition from '../unit-econ/CacComposition';
import MagicNumberTrend from '../unit-econ/MagicNumberTrend';
import BurnMultipleTrend from '../unit-econ/BurnMultipleTrend';

export default function UnitEconView() {
  return (
    <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <UeKpiTiles />
      <MathCallouts />
      <BulletCards />
      <CohortDecay />
      <CacComposition />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <MagicNumberTrend />
        <BurnMultipleTrend />
      </div>
    </div>
  );
}
