/* Apply scenario shocks compoundly to assumptions per spec §7. */

import type { Assumptions, ScenarioId } from './types';
import { applySelfServeShocks } from './engine-self-serve';
import { applySalesLedShocks } from './engine-sales-led';

export function applyScenario(A: Assumptions, scenario: ScenarioId): Assumptions {
  if (scenario === 'base') return A;
  const shocks = A.scenarios[scenario];
  return {
    ...A,
    self_serve: applySelfServeShocks(A, shocks),
    sales_led: applySalesLedShocks(A, shocks),
  };
}
