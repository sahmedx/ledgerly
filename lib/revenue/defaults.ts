/* Default Assumptions per spec §4.1 + §6 + §7. */

import type { Assumptions, PipelineDeal, ScenarioShocks } from './types';
import { STARTING_STATE } from './starting-state';

const RAMP_CURVE_12 = [
  0, 0, 0,
  0.33, 0.33, 0.33,
  0.66, 0.66, 0.66,
  1.0, 1.0, 1.0,
];

const SEED_PIPELINE: PipelineDeal[] = [
  { id: 'd1',  company: 'Northwind Co.',     stage: 'commit',     acv: 480_000, expected_close_month: 1, segment: 'business_large' },
  { id: 'd2',  company: 'Acme Industries',   stage: 'proposal',   acv: 320_000, expected_close_month: 1, segment: 'business_large' },
  { id: 'd3',  company: 'Vega Aerospace',    stage: 'commit',     acv: 1_200_000, expected_close_month: 2, segment: 'enterprise' },
  { id: 'd4',  company: 'Holberton Bank',    stage: 'proposal',   acv: 850_000, expected_close_month: 2, segment: 'enterprise' },
  { id: 'd5',  company: 'Marlin Studios',    stage: 'discovery',  acv: 240_000, expected_close_month: 2, segment: 'business_large' },
  { id: 'd6',  company: 'Stratus Health',    stage: 'commit',     acv: 1_800_000, expected_close_month: 3, segment: 'enterprise' },
  { id: 'd7',  company: 'Pemberton Foods',   stage: 'proposal',   acv: 410_000, expected_close_month: 3, segment: 'business_large' },
  { id: 'd8',  company: 'Larkspur Media',    stage: 'discovery',  acv: 280_000, expected_close_month: 3, segment: 'business_large' },
  { id: 'd9',  company: 'Apex Logistics',    stage: 'qualified',  acv: 600_000, expected_close_month: 4, segment: 'enterprise' },
  { id: 'd10', company: 'Crestwood Inc.',    stage: 'proposal',   acv: 360_000, expected_close_month: 4, segment: 'business_large' },
  { id: 'd11', company: 'Grand Valley',      stage: 'commit',     acv: 920_000, expected_close_month: 4, segment: 'enterprise' },
  { id: 'd12', company: 'Trident Robotics',  stage: 'discovery',  acv: 500_000, expected_close_month: 5, segment: 'enterprise' },
  { id: 'd13', company: 'Halcyon Group',     stage: 'proposal',   acv: 290_000, expected_close_month: 5, segment: 'business_large' },
  { id: 'd14', company: 'Quill & Ledger',    stage: 'qualified',  acv: 220_000, expected_close_month: 5, segment: 'business_large' },
  { id: 'd15', company: 'Solace Health',     stage: 'commit',     acv: 1_400_000, expected_close_month: 6, segment: 'enterprise' },
  { id: 'd16', company: 'Brindle Apparel',   stage: 'proposal',   acv: 340_000, expected_close_month: 6, segment: 'business_large' },
  { id: 'd17', company: 'Foster Manufacturing', stage: 'discovery', acv: 410_000, expected_close_month: 6, segment: 'business_large' },
];

const BASE_SHOCKS: ScenarioShocks = {
  free_pool_growth: 1.0,
  free_to_paid_rate: 1.0,
  plus_to_business_upgrade_rate: 1.0,
  attainment: 1.0,
  win_rate: 1.0,
  self_serve_churn: 1.0,
  sales_led_churn: 1.0,
  expansion_rate: 1.0,
};

const UPSIDE_SHOCKS: ScenarioShocks = {
  free_pool_growth: 1.20,
  free_to_paid_rate: 1.20,
  plus_to_business_upgrade_rate: 1.30,
  attainment: 1.15,
  win_rate: 1.10,
  self_serve_churn: 0.75,
  sales_led_churn: 0.80,
  expansion_rate: 1.20,
};

const DOWNSIDE_SHOCKS: ScenarioShocks = {
  free_pool_growth: 0.80,
  free_to_paid_rate: 0.80,
  plus_to_business_upgrade_rate: 0.70,
  attainment: 0.85,
  win_rate: 0.90,
  self_serve_churn: 1.25,
  sales_led_churn: 1.20,
  expansion_rate: 0.80,
};

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  starting_state: { ...STARTING_STATE },
  self_serve: {
    free_pool_monthly_growth: 0.015,
    free_to_paid_rate: 0.00025,
    tier_mix_on_conversion: { plus: 0.80, business_small: 0.20 },
    initial_seats_per_workspace: { plus: 4, business_small: 12 },
    legacy_seats_per_workspace: { plus: 4, business_small: 12 },
    monthly_seat_growth_rate: { plus: 0.005, business_small: 0.010 },
    plus_to_business_upgrade_rate: 0.010,
    retention: {
      plus:                   { floor: 0.55, decay: 0.20 },
      business_small:         { floor: 0.70, decay: 0.10 },
      legacy_plus:            { floor: 0.65, decay: 0.08 },
      legacy_business_small:  { floor: 0.85, decay: 0.05 },
    },
    pricing: {
      plus:           { annual: 10, monthly: 12 },
      business_small: { annual: 20, monthly: 24 },
    },
    annual_billing_mix: { plus: 0.55, business_small: 0.70 },
    legacy_annual_fraction: { plus: 1.0, business_small: 1.0 },
    graduation_seat_threshold: 50,
  },
  sales_led: {
    avg_seats_per_logo: { business_large: 100, enterprise: 500 },
    blended_seat_price: { business_large: 20, enterprise: 25 },
    enterprise_avg_acv: 150_000,
    named_pipeline: SEED_PIPELINE,
    named_pipeline_weighted_acv: 40_000_000,
    stage_probability: {
      qualified: 0.10,
      discovery: 0.25,
      proposal:  0.50,
      commit:    0.80,
    },
    pipeline_taper_start_month: 4,
    pipeline_taper_end_month: 9,
    capacity_segment_split: { business_large: 0.50, enterprise: 0.50 },
    sales_capacity: {
      hiring_plan: Array.from({ length: 24 }, (_, i) => ({ month: i + 1, count: 3 })),
      ramp_curve: RAMP_CURVE_12,
      fully_ramped_quota_annual: 1_200_000,
      attainment: 0.80,
      monthly_attrition_rate: 0.015,
      replacement_lag_months: 2,
    },
    win_rate: 0.30,
    existing_customer_dynamics: {
      business_large: { gross_churn: 0.005, contraction: 0.003, expansion: 0.015 },
      enterprise:     { gross_churn: 0.002, contraction: 0.004, expansion: 0.020 },
    },
    legacy_anniversary_distribution: [
      0.10, 0, 0, 0.10, 0, 0, 0.10, 0, 0, 0.70, 0, 0,
    ],
  },
  costs: {
    sm: {
      sdr_ratio: 0.5,
      se_ratio: 0.3,
      reps_per_manager: 8,
      flc: { rep: 300_000, sdr: 150_000, se: 250_000, manager: 400_000, mktg: 250_000 },
      marketing_programs_pct_of_revenue: 0.16,
      marketing_hiring_plan: Array.from({ length: 24 }, (_, i) => ({ month: i + 1, count: 1 })),
    },
    rd: {
      hiring_plan: Array.from({ length: 24 }, (_, i) => ({ month: i + 1, count: 5 })),
      flc_per_eng: 400_000,
      tooling_pct_of_revenue: 0.02,
    },
    ga: {
      hiring_plan: Array.from({ length: 24 }, (_, i) => ({ month: i + 1, count: 1 })),
      flc_per_ga: 250_000,
      te_pct_of_revenue: 0.045,
    },
    cs: {
      csm_per_enterprise_logos: 25,
      csm_per_business_large_logos: 100,
      flc_per_csm: 200_000,
      cs_in_cogs_pct: 0.70,
    },
    cogs: {
      hosting_pct_of_revenue: 0.08,
      payment_processing_pct_self_serve: 0.03,
      payment_processing_pct_sales_led: 0.01,
      ai_inference_pct_of_paid_arr: 0.12,
    },
    sbc: {
      rd_sbc_pct: 0.65,
      sm_sbc_pct: 0.35,
      ga_sbc_pct: 0.50,
      cs_sbc_pct: 0.30,
    },
    da: {
      monthly_da_amount: 1_500_000,
    },
    allocation: {
      marketing_self_serve_pct: 0.70,
      rd_self_serve_pct: 0.60,
    },
  },
  scenarios: {
    base:     BASE_SHOCKS,
    upside:   UPSIDE_SHOCKS,
    downside: DOWNSIDE_SHOCKS,
  },
  ipo_multiples: { low: 10, mid: 12, high: 15 },
};
