/* Billings + revenue recognition + deferred revenue per spec §6.4.
 *
 * Approach:
 * - Self-serve revenue ≈ MRR (already computed in engine-self-serve).
 * - Sales-led revenue = sales_led_arr / 12 (smooth proxy; annual prepay is recognized ratably).
 * - Self-serve billings: monthly portion bills every month; annual portion bills at
 *   first_billing_month + n*12.
 * - Sales-led billings: initial billing at acquisition month, renewals at +12k. Day-0
 *   base bills per legacy_anniversary_distribution; that distribution repeats every 12 months.
 * - Renewals are at face value (not adjusted for between-renewal churn). Documented
 *   in methodology.
 */

import type { Assumptions } from './types';
import {
  type SelfServeState,
  activeWorkspaces,
  seatsPerWorkspace,
} from './engine-self-serve';
import { type SalesLedState } from './engine-sales-led';

export interface BillingsState {
  /** Running deferred revenue balance — accumulates billings - revenue. */
  deferred_revenue: number;
}

export function initBillingsState(): BillingsState {
  return { deferred_revenue: 0 };
}

export interface BillingsInput {
  ss_state: SelfServeState;
  sl_state: SalesLedState;
  ss_revenue: number;       // = self-serve MRR
  sl_arr: number;           // ending sales-led ARR for the month
}

export interface BillingsOutput {
  ss_billings: number;
  sl_billings: number;
  ss_revenue: number;
  sl_revenue: number;
  total_billings: number;
  total_revenue: number;
  deferred_revenue_balance: number;
}

export function computeBillings(
  t: number,
  A: Assumptions,
  state: BillingsState,
  input: BillingsInput,
): BillingsOutput {
  const { ss_state, sl_state, ss_revenue, sl_arr } = input;

  // Self-serve billings — per cohort
  let ss_billings = 0;
  const ss = A.self_serve;
  const allCohorts = [...ss_state.plus_cohorts, ...ss_state.business_cohorts];
  for (const cohort of allCohorts) {
    if (cohort.graduated_at_month !== null && cohort.graduated_at_month <= t) continue;
    const active = activeWorkspaces(cohort, t, A);
    if (active <= 0) continue;
    const spw = seatsPerWorkspace(cohort, t, A);
    const pricing = ss.pricing[cohort.tier];
    const af = cohort.annual_fraction;
    const seats = active * spw;

    // Monthly portion — bills every month
    ss_billings += seats * (1 - af) * pricing.monthly;

    // Annual portion — bills at first_billing_month and every 12 months thereafter
    const months_since_first = t - cohort.first_billing_month;
    if (months_since_first >= 0 && months_since_first % 12 === 0) {
      ss_billings += seats * af * pricing.annual * 12;
    }
  }

  // Sales-led billings — calendar-driven
  // Initial billing at month t
  const initial_at_t = sl_state.sl_billable_added_by_month[t] ?? 0;
  // Renewals from prior months: t-12, t-24, ...
  let renewal_billings = 0;
  for (let k = 12; k <= t; k += 12) {
    renewal_billings += sl_state.sl_billable_added_by_month[t - k] ?? 0;
  }
  // Day-0 anniversaries — distribution repeats every 12 months
  const day0_arr =
      A.starting_state.sales_led_arr.business_large
    + A.starting_state.sales_led_arr.enterprise;
  const dist = A.sales_led.legacy_anniversary_distribution;
  const cycle_idx = (t - 1) % 12;
  const day0_anniversary = day0_arr * (dist[cycle_idx] ?? 0);

  const sl_billings = initial_at_t + renewal_billings + day0_anniversary;

  // Revenue
  const sl_revenue = sl_arr / 12;
  const total_revenue = ss_revenue + sl_revenue;
  const total_billings = ss_billings + sl_billings;

  // Deferred revenue accumulator
  state.deferred_revenue = state.deferred_revenue + total_billings - total_revenue;

  return {
    ss_billings,
    sl_billings,
    ss_revenue,
    sl_revenue,
    total_billings,
    total_revenue,
    deferred_revenue_balance: state.deferred_revenue,
  };
}
