/* Self-serve engine — cohort-based simulation per spec §6.1. */

import type { Assumptions, MonthlySelfServe, ScenarioShocks, SelfServeTierId } from './types';

export interface SelfServeCohort {
  tier: SelfServeTierId;
  acquisition_month: number;     // 0 = legacy day-0, 1..24 = new
  is_legacy: boolean;
  initial_workspaces: number;
  initial_seats_per_workspace: number;
  annual_fraction: number;
  upgraded_out: number;          // running total of workspaces upgraded out (Plus only)
  graduated_at_month: number | null;  // Business cohorts only
  first_billing_month: number;
}

export interface SelfServeState {
  free_pool: number;
  plus_cohorts: SelfServeCohort[];
  business_cohorts: SelfServeCohort[];
}

export function initSelfServeState(A: Assumptions): SelfServeState {
  const ss = A.self_serve;
  return {
    free_pool: A.starting_state.free_users,
    plus_cohorts: [{
      tier: 'plus',
      acquisition_month: 0,
      is_legacy: true,
      initial_workspaces: A.starting_state.workspaces.plus,
      initial_seats_per_workspace: ss.legacy_seats_per_workspace.plus,
      annual_fraction: ss.legacy_annual_fraction.plus,
      upgraded_out: 0,
      graduated_at_month: null,
      first_billing_month: 0,
    }],
    business_cohorts: [{
      tier: 'business_small',
      acquisition_month: 0,
      is_legacy: true,
      initial_workspaces: A.starting_state.workspaces.business_small,
      initial_seats_per_workspace: ss.legacy_seats_per_workspace.business_small,
      annual_fraction: ss.legacy_annual_fraction.business_small,
      upgraded_out: 0,
      graduated_at_month: null,
      first_billing_month: 0,
    }],
  };
}

function retentionParams(cohort: SelfServeCohort, A: Assumptions) {
  const r = A.self_serve.retention;
  if (cohort.is_legacy) return cohort.tier === 'plus' ? r.legacy_plus : r.legacy_business_small;
  return cohort.tier === 'plus' ? r.plus : r.business_small;
}

export function activeWorkspaces(cohort: SelfServeCohort, t: number, A: Assumptions): number {
  if (cohort.graduated_at_month !== null && cohort.graduated_at_month <= t) return 0;
  const a = t - cohort.acquisition_month;
  if (a < 0) return 0;
  const ret = retentionParams(cohort, A);
  const surviving_frac = ret.floor + (1 - ret.floor) * Math.exp(-ret.decay * a);
  return Math.max(0, cohort.initial_workspaces * surviving_frac - cohort.upgraded_out);
}

export function seatsPerWorkspace(cohort: SelfServeCohort, t: number, A: Assumptions): number {
  const a = Math.max(0, t - cohort.acquisition_month);
  const growth = cohort.tier === 'plus'
    ? A.self_serve.monthly_seat_growth_rate.plus
    : A.self_serve.monthly_seat_growth_rate.business_small;
  return cohort.initial_seats_per_workspace * Math.pow(1 + growth, a);
}

/** Per-cohort blended seat price (uses cohort.annual_fraction so legacy and new cohorts can differ). */
export function cohortSeatPrice(cohort: SelfServeCohort, A: Assumptions): number {
  const pricing = A.self_serve.pricing[cohort.tier];
  const af = cohort.annual_fraction;
  return af * pricing.annual + (1 - af) * pricing.monthly;
}

/** Apply scenario shocks to self-serve drivers. */
export function applySelfServeShocks(A: Assumptions, shocks: ScenarioShocks): Assumptions['self_serve'] {
  const ss = A.self_serve;
  const churn_factor = shocks.self_serve_churn;
  return {
    ...ss,
    free_pool_monthly_growth: ss.free_pool_monthly_growth * shocks.free_pool_growth,
    free_to_paid_rate: ss.free_to_paid_rate * shocks.free_to_paid_rate,
    plus_to_business_upgrade_rate: ss.plus_to_business_upgrade_rate * shocks.plus_to_business_upgrade_rate,
    retention: {
      // Higher churn = lower floor, higher decay (harsher curve)
      plus:                  scaleRetention(ss.retention.plus, churn_factor),
      business_small:        scaleRetention(ss.retention.business_small, churn_factor),
      legacy_plus:           scaleRetention(ss.retention.legacy_plus, churn_factor),
      legacy_business_small: scaleRetention(ss.retention.legacy_business_small, churn_factor),
    },
  };
}

function scaleRetention(r: { floor: number; decay: number }, churn_factor: number) {
  // churn_factor > 1 = more churn → reduce floor and increase decay
  // churn_factor < 1 = less churn → increase floor and decrease decay
  const floor = Math.max(0, Math.min(1, r.floor / churn_factor));
  const decay = r.decay * churn_factor;
  return { floor, decay };
}

export function stepSelfServe(
  state: SelfServeState,
  t: number,
  A: Assumptions,
): MonthlySelfServe {
  const ss = A.self_serve;

  // Step A: free pool update
  const new_paid = state.free_pool * ss.free_to_paid_rate;
  state.free_pool = state.free_pool * (1 + ss.free_pool_monthly_growth) - new_paid;

  // Step B: route conversions to tiers, create new cohorts
  const new_plus_ws = new_paid * ss.tier_mix_on_conversion.plus;
  const new_biz_ws = new_paid * ss.tier_mix_on_conversion.business_small;

  if (new_plus_ws > 0) {
    state.plus_cohorts.push({
      tier: 'plus',
      acquisition_month: t,
      is_legacy: false,
      initial_workspaces: new_plus_ws,
      initial_seats_per_workspace: ss.initial_seats_per_workspace.plus,
      annual_fraction: ss.annual_billing_mix.plus,
      upgraded_out: 0,
      graduated_at_month: null,
      first_billing_month: t,
    });
  }
  if (new_biz_ws > 0) {
    state.business_cohorts.push({
      tier: 'business_small',
      acquisition_month: t,
      is_legacy: false,
      initial_workspaces: new_biz_ws,
      initial_seats_per_workspace: ss.initial_seats_per_workspace.business_small,
      annual_fraction: ss.annual_billing_mix.business_small,
      upgraded_out: 0,
      graduated_at_month: null,
      first_billing_month: t,
    });
  }

  // Step E: Plus → Business upgrades. Aggregate per-month into single new Business cohort.
  let total_upgrades = 0;
  let total_upgrade_seats_weighted = 0;
  for (const cohort of state.plus_cohorts) {
    const active = activeWorkspaces(cohort, t, A);
    if (active <= 0) continue;
    const upgrades = active * ss.plus_to_business_upgrade_rate;
    cohort.upgraded_out += upgrades;
    const spw = seatsPerWorkspace(cohort, t, A);
    total_upgrades += upgrades;
    total_upgrade_seats_weighted += upgrades * spw;
  }
  if (total_upgrades > 0) {
    const weighted_seats = total_upgrade_seats_weighted / total_upgrades;
    state.business_cohorts.push({
      tier: 'business_small',
      acquisition_month: t,
      is_legacy: false,
      initial_workspaces: total_upgrades,
      initial_seats_per_workspace: weighted_seats,
      annual_fraction: ss.annual_billing_mix.business_small,
      upgraded_out: 0,
      graduated_at_month: null,
      first_billing_month: t,
    });
  }

  // Step F: graduations — Business cohorts crossing seat threshold
  let graduations_count = 0;
  let graduated_arr = 0;
  for (const cohort of state.business_cohorts) {
    if (cohort.graduated_at_month !== null) continue;
    const spw = seatsPerWorkspace(cohort, t, A);
    if (spw >= ss.graduation_seat_threshold) {
      const active = activeWorkspaces(cohort, t, A);
      if (active <= 0) {
        cohort.graduated_at_month = t;
        continue;
      }
      const cohort_arr = active * spw * cohortSeatPrice(cohort, A) * 12;
      cohort.graduated_at_month = t;
      graduations_count += active;
      graduated_arr += cohort_arr;
    }
  }

  // Step G: aggregate active workspaces / seats / MRR — per cohort
  let plus_workspaces = 0, plus_seats = 0, plus_mrr = 0;
  for (const cohort of state.plus_cohorts) {
    const active = activeWorkspaces(cohort, t, A);
    if (active <= 0) continue;
    const spw = seatsPerWorkspace(cohort, t, A);
    plus_workspaces += active;
    plus_seats += active * spw;
    plus_mrr += active * spw * cohortSeatPrice(cohort, A);
  }
  let biz_workspaces = 0, biz_seats = 0, biz_mrr = 0;
  for (const cohort of state.business_cohorts) {
    if (cohort.graduated_at_month !== null && cohort.graduated_at_month <= t) continue;
    const active = activeWorkspaces(cohort, t, A);
    if (active <= 0) continue;
    const spw = seatsPerWorkspace(cohort, t, A);
    biz_workspaces += active;
    biz_seats += active * spw;
    biz_mrr += active * spw * cohortSeatPrice(cohort, A);
  }

  return {
    free_users: state.free_pool,
    new_paid_workspaces: new_paid,
    active_workspaces: { plus: plus_workspaces, business_small: biz_workspaces },
    active_seats: { plus: plus_seats, business_small: biz_seats },
    mrr: { plus: plus_mrr, business_small: biz_mrr },
    arr: { plus: plus_mrr * 12, business_small: biz_mrr * 12 },
    plus_to_business_upgrades: total_upgrades,
    graduations_to_sales_led: graduations_count,
    graduated_arr,
  };
}
