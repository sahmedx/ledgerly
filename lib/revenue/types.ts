/* Revenue module types — input assumptions + output results.
 * Mirrors notion_forecast_spec.md §4. */

export type ScenarioId = 'base' | 'upside' | 'downside';

export type SalesLedSegmentId = 'business_large' | 'enterprise';
export type SelfServeTierId = 'plus' | 'business_small';

export interface PipelineDeal {
  id: string;
  company: string;
  stage: 'qualified' | 'discovery' | 'proposal' | 'commit';
  acv: number;
  expected_close_month: number; // 1..6
  segment: SalesLedSegmentId;
}

export interface RetentionParams {
  floor: number;
  decay: number;
}

export interface HiringPlanEntry {
  month: number;
  count: number;
}

export interface Assumptions {
  starting_state: {
    self_serve_arr: { plus: number; business_small: number };
    sales_led_arr: { business_large: number; enterprise: number };
    workspaces: { plus: number; business_small: number };
    logos: { business_large: number; enterprise: number };
    free_users: number;
    total_headcount: number;
    quota_reps: number;
    rd_headcount: number;
    ga_headcount: number;
    cs_headcount: number;
    marketing_headcount: number;
  };
  self_serve: {
    free_pool_monthly_growth: number;
    free_to_paid_rate: number;
    tier_mix_on_conversion: { plus: number; business_small: number };
    initial_seats_per_workspace: { plus: number; business_small: number };
    legacy_seats_per_workspace: { plus: number; business_small: number };
    monthly_seat_growth_rate: { plus: number; business_small: number };
    plus_to_business_upgrade_rate: number;
    retention: {
      plus: RetentionParams;
      business_small: RetentionParams;
      legacy_plus: RetentionParams;
      legacy_business_small: RetentionParams;
    };
    pricing: {
      plus: { annual: number; monthly: number };
      business_small: { annual: number; monthly: number };
    };
    annual_billing_mix: { plus: number; business_small: number };
    /** Annual-billing fraction applied to the Day-0 legacy cohort specifically.
     *  Spec §5 starting ARR is computed at annual pricing; default = 1.0 for both tiers. */
    legacy_annual_fraction: { plus: number; business_small: number };
    graduation_seat_threshold: number;
  };
  sales_led: {
    avg_seats_per_logo: { business_large: number; enterprise: number };
    blended_seat_price: { business_large: number; enterprise: number };
    enterprise_avg_acv: number;
    named_pipeline: PipelineDeal[];
    /** Weighted (post-stage-probability) pipeline ACV across months 1..(seam-1).
     *  The engine distributes this scalar evenly across pre-seam months to produce
     *  `new_arr_named_pipeline`. The deal list above is illustrative-only (table + chart);
     *  consuming both would double-discount. */
    named_pipeline_weighted_acv: number;
    stage_probability: {
      qualified: number;
      discovery: number;
      proposal: number;
      commit: number;
    };
    /** First month at which named pipeline begins to fade out. Before this, pipeline runs at full weight. */
    pipeline_taper_start_month: number;
    /** Last month of named-pipeline contribution. After this, capacity carries 100% of new ARR.
     *  Capacity weight ramps in over the taper window as 1 - pipelineWeight, so no double-count. */
    pipeline_taper_end_month: number;
    capacity_segment_split: { business_large: number; enterprise: number };
    sales_capacity: {
      hiring_plan: HiringPlanEntry[];
      ramp_curve: number[];
      fully_ramped_quota_annual: number;
      attainment: number;
      monthly_attrition_rate: number;
      replacement_lag_months: number;
    };
    win_rate: number;
    existing_customer_dynamics: {
      business_large: { gross_churn: number; contraction: number; expansion: number };
      enterprise:     { gross_churn: number; contraction: number; expansion: number };
    };
    /** Distribution of Day-0 anniversary months. Sum = 1.0. Index 0 = Jan 26 anniversary, etc. */
    legacy_anniversary_distribution: number[];
  };
  costs: {
    sm: {
      sdr_ratio: number;
      se_ratio: number;
      reps_per_manager: number;
      flc: { rep: number; sdr: number; se: number; manager: number; mktg: number };
      marketing_programs_pct_of_revenue: number;
      marketing_hiring_plan: HiringPlanEntry[];
    };
    rd: {
      hiring_plan: HiringPlanEntry[];
      flc_per_eng: number;
      tooling_pct_of_revenue: number;
    };
    ga: {
      hiring_plan: HiringPlanEntry[];
      flc_per_ga: number;
      te_pct_of_revenue: number;
    };
    cs: {
      csm_per_enterprise_logos: number;
      csm_per_business_large_logos: number;
      flc_per_csm: number;
      cs_in_cogs_pct: number;
    };
    cogs: {
      hosting_pct_of_revenue: number;
      payment_processing_pct_self_serve: number;
      payment_processing_pct_sales_led: number;
      /** AI-inference COGS as fraction of total paid ARR (Plus + Business + Enterprise). */
      ai_inference_pct_of_paid_arr: number;
    };
    /** SBC ratios applied to cash comp by function (spec §3.2). */
    sbc: {
      rd_sbc_pct: number;
      sm_sbc_pct: number;
      ga_sbc_pct: number;
      cs_sbc_pct: number;
    };
    /** D&A placeholder (spec §3.1). Flat monthly amount. */
    da: {
      monthly_da_amount: number;
    };
    /** Cost allocation between segments (spec §4). Surfaced in P&L drawer. */
    allocation: {
      marketing_self_serve_pct: number;
      rd_self_serve_pct: number;
    };
  };
  scenarios: {
    base: ScenarioShocks;
    upside: ScenarioShocks;
    downside: ScenarioShocks;
  };
  ipo_multiples: { low: number; mid: number; high: number };
}

/** Shock multipliers applied multiplicatively (compound) to base assumptions. */
export interface ScenarioShocks {
  free_pool_growth: number;
  free_to_paid_rate: number;
  plus_to_business_upgrade_rate: number;
  attainment: number;
  win_rate: number;
  self_serve_churn: number;
  sales_led_churn: number;
  expansion_rate: number;
}

export interface MonthlySelfServe {
  free_users: number;
  new_paid_workspaces: number;
  active_workspaces: { plus: number; business_small: number };
  active_seats: { plus: number; business_small: number };
  mrr: { plus: number; business_small: number };
  arr: { plus: number; business_small: number };
  plus_to_business_upgrades: number;
  graduations_to_sales_led: number;
  graduated_arr: number;
}

export interface MonthlySalesLed {
  active_logos: { business_large: number; enterprise: number };
  new_arr_named_pipeline: number;
  new_arr_capacity: number;
  new_arr_graduation: number;
  expansion_arr: number;
  contraction_arr: number;
  churn_arr: number;
  ending_arr: { business_large: number; enterprise: number };
  active_reps: number;
  productive_capacity_arr: number;
}

export interface MonthlyTotal {
  arr: number;
  mrr: number;
  revenue: number;
  billings: number;
  deferred_revenue_balance: number;
  ai_influenced_arr: number;
  ai_influenced_pct: number;
}

export interface MonthlyCosts {
  // COGS sub-lines (spec §7.1)
  hosting: number;
  payment_processing_self_serve: number;
  payment_processing_sales_led: number;
  ai_inference_self_serve: number;     // direct: business_small only
  ai_inference_sales_led: number;      // direct: business_large + enterprise
  cs_in_cogs: number;                  // includes CS SBC × cs_in_cogs_pct
  cogs: number;                        // = sum of above

  gross_profit: number;
  gross_margin_pct: number;

  // S&M sub-lines
  sm_cash_comp: number;
  sm_sbc: number;
  sm_programs: number;
  sm_total: number;

  // R&D sub-lines
  rd_cash_comp: number;
  rd_sbc: number;
  rd_tooling: number;
  rd_total: number;

  // G&A sub-lines
  ga_cash_comp: number;
  ga_sbc: number;
  ga_te: number;
  da: number;                          // D&A flows through G&A per spec §3.3
  ga_total: number;

  // CS opex sub-lines
  cs_cash_comp: number;                // opex portion only (cs_cash_comp × (1 - cs_in_cogs_pct))
  cs_sbc: number;                      // opex portion only (cs_sbc × (1 - cs_in_cogs_pct))
  cs_in_opex: number;                  // = cs_cash_comp + cs_sbc above
  cs_total: number;                    // full CS spend incl. COGS portion (kept for back-compat)

  total_sbc: number;                   // FULL SBC (incl. cs_sbc COGS half) — spec §3.2 add-back

  opex_total: number;

  // GAAP / non-GAAP / EBITDA (spec §3.4-§3.5)
  operating_income: number;            // = operating_income_gaap (kept for back-compat)
  operating_margin_pct: number;        // = operating_margin_gaap_pct
  operating_income_gaap: number;
  operating_margin_gaap_pct: number;
  operating_income_non_gaap: number;
  operating_margin_non_gaap_pct: number;
  ebitda: number;
  ebitda_margin_pct: number;
  adjusted_ebitda: number;
  adjusted_ebitda_margin_pct: number;
}

export interface MonthlyHeadcount {
  sales_reps: number;
  sdrs: number;
  ses: number;
  sales_mgrs: number;
  marketing: number;
  rd: number;
  ga: number;
  cs: number;
  total: number;
}

export interface MonthlyKpis {
  nrr_ttm: number;
  grr_ttm: number;
  magic_number: number;
  burn_multiple: number;
  /** Rule of 40 = YoY ARR growth + non-GAAP operating margin. Null for t < 13 (no t-12 ARR). */
  rule_of_40: number | null;
  /** YoY ARR growth = (arr[t] - arr[t-12]) / arr[t-12]. Null for t < 13. */
  arr_yoy_growth: number | null;
  cac_payback_self_serve: number;
  cac_payback_sales_led: number;
  ltv_cac_self_serve: number;
  ltv_cac_sales_led: number;
  arpa_self_serve: number;
  arpa_sales_led: number;
  arpa_blended: number;
  total_logos: number;
}

export interface MonthlyResult {
  month_index: number;       // 1..24
  calendar_label: string;    // 'Jan 26'..'Dec 27'
  is_actual: boolean;        // months 1..3 = actual, 4..24 = forecast
  self_serve: MonthlySelfServe;
  sales_led: MonthlySalesLed;
  total: MonthlyTotal;
  costs: MonthlyCosts;
  headcount: MonthlyHeadcount;
  kpis: MonthlyKpis;
}

export interface ResolvedDeal extends PipelineDeal {
  weighted_arr: number;
  recognized_in_month: number | null; // null if past seam
}

export interface ValidationResult {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

/** Period roll-up for the P&L view. Sums dollar lines; takes period-end values for
 *  ARR-based metrics, NRR/GRR, and headcount; recomputes margins from period sums. */
export interface PeriodResult {
  /** 'Q1 2026' | 'FY2026' | etc. */
  label: string;
  /** Inclusive start month index (1..24). */
  start_month: number;
  /** Inclusive end month index (1..24). */
  end_month: number;

  // Revenue
  self_serve_revenue: number;
  self_serve_revenue_plus: number;
  self_serve_revenue_business_small: number;
  sales_led_revenue: number;
  sales_led_revenue_business_large: number;
  sales_led_revenue_enterprise: number;
  total_revenue: number;

  // COGS sub-lines + total
  hosting: number;
  payment_processing_self_serve: number;
  payment_processing_sales_led: number;
  ai_inference_self_serve: number;
  ai_inference_sales_led: number;
  cs_in_cogs: number;
  cogs: number;

  gross_profit: number;
  gross_margin_pct: number;             // recomputed: gross_profit / total_revenue

  // Opex sub-lines + totals
  sm_cash_comp: number;
  sm_sbc: number;
  sm_programs: number;
  sm_total: number;
  rd_cash_comp: number;
  rd_sbc: number;
  rd_tooling: number;
  rd_total: number;
  ga_cash_comp: number;
  ga_sbc: number;
  ga_te: number;
  da: number;
  ga_total: number;
  cs_cash_comp: number;                 // opex portion only
  cs_sbc: number;                       // opex portion only
  cs_in_opex: number;
  total_sbc: number;                    // FULL SBC (incl. CS COGS half)
  opex_total: number;

  // Operating income / EBITDA pairs (recomputed from period sums)
  operating_income_gaap: number;
  operating_margin_gaap_pct: number;
  operating_income_non_gaap: number;
  operating_margin_non_gaap_pct: number;
  ebitda: number;
  ebitda_margin_pct: number;
  adjusted_ebitda: number;
  adjusted_ebitda_margin_pct: number;

  // Period-end snapshots
  ending_arr: number;
  ending_total_headcount: number;
  ending_nrr_ttm: number;
  ending_grr_ttm: number;
  /** YoY ARR growth at period end. Null when t < 13 (no prior-year comparator). */
  arr_yoy_growth: number | null;
  /** Rule of 40 at period end (non-GAAP). Null when t < 13. */
  rule_of_40: number | null;
}

export interface Results {
  monthly: MonthlyResult[];
  /** 8 quarters: Q1'26 → Q4'27. */
  quarterly: PeriodResult[];
  /** 2 annuals: FY26, FY27. */
  annual: PeriodResult[];
  pipeline_resolved: ResolvedDeal[];
  validations: ValidationResult[];
  starting_arr: number;
  ending_arr: number;
}
