/* Sales-led engine — pipeline, capacity, base dynamics per spec §6.2. */

import type { Assumptions, MonthlySalesLed, ScenarioShocks } from './types';

interface RepCohort { hire_month: number; count: number; }
interface RepReplacement { month_due: number; count: number; }

export interface SalesLedState {
  business_large_arr: number;
  business_large_logos: number;
  enterprise_arr: number;
  enterprise_logos: number;
  rep_cohorts: RepCohort[];
  pending_replacements: RepReplacement[];
  /** ARR added per month that triggers future renewals at +12k months. Excludes graduation. */
  sl_billable_added_by_month: number[];
}

export function initSalesLedState(A: Assumptions): SalesLedState {
  return {
    business_large_arr: A.starting_state.sales_led_arr.business_large,
    business_large_logos: A.starting_state.logos.business_large,
    enterprise_arr: A.starting_state.sales_led_arr.enterprise,
    enterprise_logos: A.starting_state.logos.enterprise,
    // Day-0 reps treated as fully ramped — start at hire_month = -12
    rep_cohorts: [{ hire_month: -12, count: A.starting_state.quota_reps }],
    pending_replacements: [],
    sl_billable_added_by_month: new Array(36).fill(0),
  };
}

function rampFactor(months_since_hire: number, ramp_curve: number[]): number {
  if (months_since_hire < 0) return 0;
  if (months_since_hire >= ramp_curve.length) return 1.0;
  return ramp_curve[months_since_hire];
}

/** Linear taper of named-pipeline contribution. 1.0 before start, 0.0 after end. */
export function pipelineWeight(t: number, start: number, end: number): number {
  if (t < start) return 1.0;
  if (t >= end) return 0.0;
  if (end <= start) return 0.0;
  return 1.0 - (t - start) / (end - start);
}

/** Discrete sum of pipelineWeight(t, start, end) for t = 1..end. Used to normalize
 *  the scalar `named_pipeline_weighted_acv` across the weighted-months window. */
export function sumPipelineWeight(start: number, end: number): number {
  let s = 0;
  for (let t = 1; t <= end; t++) s += pipelineWeight(t, start, end);
  return s;
}

export function applySalesLedShocks(A: Assumptions, shocks: ScenarioShocks): Assumptions['sales_led'] {
  const sl = A.sales_led;
  const dyn = sl.existing_customer_dynamics;
  return {
    ...sl,
    win_rate: sl.win_rate * shocks.win_rate,
    sales_capacity: {
      ...sl.sales_capacity,
      attainment: sl.sales_capacity.attainment * shocks.attainment,
    },
    existing_customer_dynamics: {
      business_large: {
        gross_churn: dyn.business_large.gross_churn * shocks.sales_led_churn,
        contraction: dyn.business_large.contraction * shocks.sales_led_churn,
        expansion:   dyn.business_large.expansion   * shocks.expansion_rate,
      },
      enterprise: {
        gross_churn: dyn.enterprise.gross_churn * shocks.sales_led_churn,
        contraction: dyn.enterprise.contraction * shocks.sales_led_churn,
        expansion:   dyn.enterprise.expansion   * shocks.expansion_rate,
      },
    },
  };
}

export function stepSalesLed(
  state: SalesLedState,
  t: number,
  A: Assumptions,
  graduated_arr_in: number,
): MonthlySalesLed {
  const sl = A.sales_led;
  const dyn = sl.existing_customer_dynamics;

  // Step A: existing dynamics on BoM ARR (decision #8 — new ARR not subject to churn this month)
  const bl_arr_start = state.business_large_arr;
  const ent_arr_start = state.enterprise_arr;

  const bl_churn       = bl_arr_start  * dyn.business_large.gross_churn;
  const bl_contraction = bl_arr_start  * dyn.business_large.contraction;
  const bl_expansion   = bl_arr_start  * dyn.business_large.expansion;
  const ent_churn       = ent_arr_start * dyn.enterprise.gross_churn;
  const ent_contraction = ent_arr_start * dyn.enterprise.contraction;
  const ent_expansion   = ent_arr_start * dyn.enterprise.expansion;

  // Step B: rep updates — attrition, replacements, planned hires
  const cap = sl.sales_capacity;

  // Apply attrition to all existing cohorts
  let attrition_total = 0;
  for (const cohort of state.rep_cohorts) {
    if (cohort.count <= 0) continue;
    const departed = cohort.count * cap.monthly_attrition_rate;
    cohort.count -= departed;
    attrition_total += departed;
  }
  if (attrition_total > 0) {
    state.pending_replacements.push({
      month_due: t + cap.replacement_lag_months,
      count: attrition_total,
    });
  }

  // Process replacements that come due this month
  let replacements_now = 0;
  state.pending_replacements = state.pending_replacements.filter(r => {
    if (r.month_due <= t) {
      replacements_now += r.count;
      return false;
    }
    return true;
  });
  if (replacements_now > 0) {
    state.rep_cohorts.push({ hire_month: t, count: replacements_now });
  }

  // Planned hires this month
  const planned = cap.hiring_plan.find(h => h.month === t)?.count ?? 0;
  if (planned > 0) {
    state.rep_cohorts.push({ hire_month: t, count: planned });
  }

  // Compute productive capacity
  const monthly_quota = cap.fully_ramped_quota_annual / 12;
  let active_reps = 0;
  let productive_capacity_monthly = 0;
  for (const cohort of state.rep_cohorts) {
    if (cohort.count <= 0) continue;
    active_reps += cohort.count;
    const ramp = rampFactor(t - cohort.hire_month, cap.ramp_curve);
    productive_capacity_monthly += cohort.count * ramp * monthly_quota * cap.attainment;
  }
  const productive_capacity_arr = productive_capacity_monthly * 12;

  // Step C: blended new-ARR sources via pipeline taper.
  // pipelineWeight ∈ [0, 1] runs 1.0 → 0.0 across [taper_start, taper_end].
  // capacityWeight = 1 - pipelineWeight, so the two sources sum to one productive
  // unit at every point — no double-count, no cliff at a hard seam.
  const pw = pipelineWeight(t, sl.pipeline_taper_start_month, sl.pipeline_taper_end_month);
  const cw = 1.0 - pw;

  // Distribute scalar pipeline ACV across the weighted months so the cumulative
  // contribution equals `named_pipeline_weighted_acv` regardless of taper width.
  const total_pipeline_weight = sumPipelineWeight(
    sl.pipeline_taper_start_month,
    sl.pipeline_taper_end_month,
  );
  const pipeline_at_full = total_pipeline_weight > 0
    ? sl.named_pipeline_weighted_acv / total_pipeline_weight
    : 0;

  const new_arr_named = pipeline_at_full * pw;
  const new_arr_named_bl  = new_arr_named * sl.capacity_segment_split.business_large;
  const new_arr_named_ent = new_arr_named * sl.capacity_segment_split.enterprise;

  // Capacity is already quota × attainment = closed ARR. Multiplying by win_rate
  // here would double-discount; win_rate stays a UI concept for the deal table.
  const new_arr_capacity = productive_capacity_monthly * cw;
  const new_arr_capacity_bl  = new_arr_capacity * sl.capacity_segment_split.business_large;
  const new_arr_capacity_ent = new_arr_capacity * sl.capacity_segment_split.enterprise;

  const new_arr_graduation = graduated_arr_in;
  const new_arr_graduation_bl  = new_arr_graduation * sl.capacity_segment_split.business_large;
  const new_arr_graduation_ent = new_arr_graduation * sl.capacity_segment_split.enterprise;

  const new_arr_bl  = new_arr_named_bl  + new_arr_capacity_bl  + new_arr_graduation_bl;
  const new_arr_ent = new_arr_named_ent + new_arr_capacity_ent + new_arr_graduation_ent;

  // Step D: update ending ARR
  state.business_large_arr = bl_arr_start + new_arr_bl + bl_expansion - bl_contraction - bl_churn;
  state.enterprise_arr     = ent_arr_start + new_arr_ent + ent_expansion - ent_contraction - ent_churn;

  // Step E: logos
  const bl_avg_arr_per_logo  = sl.avg_seats_per_logo.business_large * sl.blended_seat_price.business_large * 12;
  const ent_avg_arr_per_logo = sl.enterprise_avg_acv;

  const bl_new_logos  = new_arr_bl  / bl_avg_arr_per_logo;
  const ent_new_logos = new_arr_ent / ent_avg_arr_per_logo;
  const bl_churned_logos  = state.business_large_logos * dyn.business_large.gross_churn;
  const ent_churned_logos = state.enterprise_logos     * dyn.enterprise.gross_churn;

  state.business_large_logos = Math.max(0, state.business_large_logos + bl_new_logos  - bl_churned_logos);
  state.enterprise_logos     = Math.max(0, state.enterprise_logos     + ent_new_logos - ent_churned_logos);

  // Record billable ARR added (excluding graduation, since it was already billed on the self-serve side)
  const billable_this_month =
      (new_arr_bl  - new_arr_graduation_bl)
    + (new_arr_ent - new_arr_graduation_ent)
    + bl_expansion + ent_expansion
    - bl_contraction - ent_contraction;
  if (t >= 1 && t < state.sl_billable_added_by_month.length) {
    state.sl_billable_added_by_month[t] = Math.max(0, billable_this_month);
  }

  return {
    active_logos: {
      business_large: state.business_large_logos,
      enterprise:     state.enterprise_logos,
    },
    new_arr_named_pipeline: new_arr_named,
    new_arr_capacity,
    new_arr_graduation,
    expansion_arr: bl_expansion + ent_expansion,
    contraction_arr: bl_contraction + ent_contraction,
    churn_arr: bl_churn + ent_churn,
    ending_arr: {
      business_large: state.business_large_arr,
      enterprise:     state.enterprise_arr,
    },
    active_reps,
    productive_capacity_arr,
  };
}
